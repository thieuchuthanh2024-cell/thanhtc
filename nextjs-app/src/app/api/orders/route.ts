import { NextResponse } from "next/server";
import { db } from "@/db";
import { orders, sims, agents, packages } from "@/db/schema";
import { eq, desc, and, ne, gte, or, like, sql } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const pageParam = searchParams.get("page");
    const limitParam = searchParams.get("limit");
    const statusParam = searchParams.get("status");
    const searchParam = searchParams.get("search");

    const isPaginated = pageParam !== null;

    const page = Math.max(parseInt(pageParam || "1", 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(limitParam || "20", 10) || 20, 1), 100);
    const offset = (page - 1) * limit;

    const conditions: any[] = [];

    // Filter by status if specified and not "All"
    if (statusParam && statusParam !== "All") {
      conditions.push(eq(orders.status, statusParam));
    }

    // Filter by search query if present
    if (searchParam && searchParam.trim().length > 0) {
      const cleanSearch = searchParam.trim().toLowerCase();
      conditions.push(
        or(
          like(sql`lower(${orders.id})`, `%${cleanSearch}%`),
          like(sql`lower(${orders.simNumber})`, `%${cleanSearch}%`),
          like(sql`lower(${orders.customerName})`, `%${cleanSearch}%`),
          like(sql`lower(${orders.customerPhone})`, `%${cleanSearch}%`),
          like(sql`lower(${orders.carrier})`, `%${cleanSearch}%`)
        )
      );
    }

    // Rule: "Đối với các đơn hàng đã hoàn thành, Đã hủy thì chỉ hiển thị các bản ghi trong vòng 1 năm gần đây"
    const oneYearAgoStr = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();
    conditions.push(
      or(
        and(
          ne(orders.status, "Đã hoàn thành"),
          ne(orders.status, "Đã hủy")
        ),
        gte(orders.createdAt, oneYearAgoStr)
      )
    );

    const finalQuery = and(...conditions);

    if (isPaginated) {
      // 1. Get total count
      const countResult = await db.select({ count: sql<number>`count(*)` })
        .from(orders)
        .where(finalQuery);
      const totalCount = Number(countResult[0]?.count || 0);

      // 2. Fetch list
      const list = await db.select()
        .from(orders)
        .where(finalQuery)
        .orderBy(desc(orders.createdAt))
        .limit(limit)
        .offset(offset);

      return NextResponse.json({
        orders: list,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page
      });
    } else {
      // Unpaginated compatibility mode - limit to 150 entries
      const list = await db.select()
        .from(orders)
        .where(finalQuery)
        .orderBy(desc(orders.createdAt))
        .limit(150);

      return NextResponse.json(list);
    }
  } catch (err: any) {
    console.error("GET /api/orders error:", err);
    return NextResponse.json({ error: "Failed to fetch orders: " + err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      simId,
      customerName,
      customerPhone,
      customerAddress,
      paymentMethod,
      agentId,
      packageId,
    } = body;

    if (!simId || !customerName || !customerPhone || !paymentMethod) {
      return NextResponse.json({ error: "Missing required booking details." }, { status: 400 });
    }

    const simList = await db.select().from(sims).where(eq(sims.id, simId));
    if (simList.length === 0) {
      return NextResponse.json({ error: "SIM card not found." }, { status: 404 });
    }
    const sim = simList[0];

    if (sim.status === "Đã bán") {
      return NextResponse.json({ error: "Số sim này đã có người mua. Xin trân trọng cám ơn!" }, { status: 400 });
    }

    let finalPrice = sim.price;
    let agentRole: string | null = null;

    // Apply agent commission / discount rate if active
    if (agentId) {
      const agentList = await db.select().from(agents).where(eq(agents.id, agentId));
      if (agentList.length > 0) {
        const agent = agentList[0];
        agentRole = agent.role;
        finalPrice = sim.price * (1 - agent.discountRate);
      }
    }

    let pkg = null;
    if (packageId) {
      const pkgList = await db.select().from(packages).where(eq(packages.id, packageId));
      if (pkgList.length > 0) {
        pkg = pkgList[0];
      }
    }

    const orderId = "ord-" + Math.floor(Math.random() * 9000 + 1000);
    const paymentStatusVal = paymentMethod === "vietqr" || paymentMethod === "momo" || paymentMethod === "vnpay" ? "Chờ thanh toán" : "Đã thanh toán";
    const statusVal = "Chờ duyệt";

    const newOrder = {
      id: orderId,
      simId: sim.id,
      simNumber: sim.number,
      carrier: sim.carrier,
      price: sim.price,
      discountPrice: finalPrice,
      agentId: agentId || null,
      agentRole: agentRole,
      customerName,
      customerPhone,
      customerAddress: customerAddress || "Người mua tự nhận tại quầy / COD",
      paymentMethod,
      paymentStatus: paymentStatusVal,
      status: statusVal,
      createdAt: new Date().toISOString(),
      packageId: pkg ? pkg.id : null,
      packageName: pkg ? pkg.name : null,
      packageFee: pkg ? pkg.monthlyFee : null,
      packageDetails: pkg ? `${pkg.dataLimitText || (pkg.dataGb + 'GB')} data, ${pkg.minutesInternal}p nội mạng, ${pkg.minutesExternal}p ngoại mạng` : null,
      isPackageMandatory: pkg ? pkg.isMandatory : false
    };

    // Update SIM card status
    const simStatusVal = paymentMethod === "vietqr" || paymentMethod === "momo" || paymentMethod === "vnpay" ? "Chờ thanh toán" : "Đã giữ chỗ";
    
    await db.insert(orders).values(newOrder);
    await db.update(sims).set({ status: simStatusVal }).where(eq(sims.id, sim.id));

    return NextResponse.json({ success: true, order: newOrder });
  } catch (err: any) {
    console.error("POST /api/orders error:", err);
    return NextResponse.json({ error: "Failed to place order: " + err.message }, { status: 500 });
  }
}
