import { NextResponse } from "next/server";
import { db } from "@/db";
import { orders, sims } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const list = await db
      .select()
      .from(orders)
      .orderBy(desc(orders.createdAt));
    return NextResponse.json(list);
  } catch (err: any) {
    console.error("GET /api/orders error:", err);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      id,
      simId,
      simNumber,
      carrier,
      price,
      discountPrice,
      agentId,
      agentRole,
      customerName,
      customerPhone,
      customerAddress,
      paymentMethod,
    } = body;

    if (!id || !simId || !simNumber || !customerName || !customerPhone || !paymentMethod) {
      return NextResponse.json({ error: "Missing required order fields" }, { status: 400 });
    }

    // Insert order entry
    await db.insert(orders).values({
      id,
      simId,
      simNumber,
      carrier,
      price: parseFloat(price),
      discountPrice: parseFloat(discountPrice),
      agentId: agentId || null,
      agentRole: agentRole || null,
      customerName,
      customerPhone,
      customerAddress: customerAddress || null,
      paymentMethod,
      paymentStatus: "Chờ thanh toán",
      status: "Chờ duyệt",
      createdAt: new Date().toISOString(),
    });

    // Mark SIM card status as Reserved/Pending
    await db.update(sims).set({ status: "Chờ thanh toán" }).where(eq(sims.id, simId));

    return NextResponse.json({ success: true, orderId: id });
  } catch (err: any) {
    console.error("POST /api/orders error:", err);
    return NextResponse.json({ error: "Failed to place order" }, { status: 500 });
  }
}
