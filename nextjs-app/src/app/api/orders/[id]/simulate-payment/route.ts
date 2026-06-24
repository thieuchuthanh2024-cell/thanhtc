import { NextResponse } from "next/server";
import { db } from "@/db";
import { orders, sims, agents } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: Request, { params }: { params: any }) {
  try {
    const resolvedParams = await params;
    const id = resolvedParams?.id;

    if (!id) {
      return NextResponse.json({ error: "Yêu cầu mã đơn hàng hợp lệ." }, { status: 400 });
    }

    // Dynamic environment resilience: if database configuration is missing on client/vercel deploy,
    // seamlessly forward the request to the Express Backend which holds full server connections!
    const hasDbEnv = process.env.SQL_HOST && process.env.SQL_USER && process.env.SQL_PASSWORD;
    if (!hasDbEnv) {
      console.log(`[Next.js API] Missing database env. Proxying simulate-payment request to Express Backend for order ID: ${id}`);
      const backendUrl = process.env.BACKEND_URL || "http://localhost:3000";
      const forwardRes = await fetch(`${backendUrl}/api/orders/${id}/simulate-payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      const data = await forwardRes.json();
      return NextResponse.json(data, { status: forwardRes.status });
    }

    const list = await db.select().from(orders).where(eq(orders.id, id));
    if (list.length === 0) {
      return NextResponse.json({ error: `Không tìm thấy đơn hàng với mã: ${id}` }, { status: 404 });
    }
    const order = list[0];

    // Lock SIM to SOLD status
    await db.update(sims).set({ status: "Đã bán" }).where(eq(sims.id, order.simId));

    // Update Order payment and status
    await db.update(orders).set({
      paymentStatus: "Đã thanh toán",
      status: "Đang xử lý"
    }).where(eq(orders.id, id));

    // Accumulate Agent sales/commissions with safe math defaults
    if (order.agentId) {
      const agentList = await db.select().from(agents).where(eq(agents.id, order.agentId));
      if (agentList.length > 0) {
        const agent = agentList[0];
        const currentCommission = agent.commissionEarned || 0;
        const currentTotalSales = agent.totalSales || 0;
        const commission = (order.price || 0) - (order.discountPrice || 0);
        await db.update(agents).set({
          commissionEarned: currentCommission + commission,
          totalSales: currentTotalSales + (order.price || 0)
        }).where(eq(agents.id, agent.id));
      }
    }

    const updatedOrder = {
      ...order,
      paymentStatus: "Đã thanh toán",
      status: "Đang xử lý"
    };

    return NextResponse.json({ success: true, order: updatedOrder });
  } catch (err: any) {
    console.error("POST /api/orders/[id]/simulate-payment error:", err);

    // Ultimate fallback rescue mechanism: forward to Express backend if any SQL or database connection fails
    try {
      const resolvedParams = await params;
      const id = resolvedParams?.id;
      if (id) {
        console.log(`[Next.js API Fallback] DB execution failed. Forwarding simulate-payment request to Express Backend as backup for order ID: ${id}`);
        const backendUrl = process.env.BACKEND_URL || "http://localhost:3000";
        const forwardRes = await fetch(`${backendUrl}/api/orders/${id}/simulate-payment`, {
          method: "POST",
          headers: { "Content-Type": "application/json" }
        });
        const data = await forwardRes.json();
        return NextResponse.json(data, { status: forwardRes.status });
      }
    } catch (fallbackErr: any) {
      console.error("Next.js simulate-payment proxy fallback rescue failed:", fallbackErr);
    }

    return NextResponse.json({ error: "Lỗi giả lập thanh toán: " + err.message }, { status: 500 });
  }
}
