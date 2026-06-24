import { NextResponse } from "next/server";
import { db } from "@/db";
import { orders, sims, agents } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: Request, { params }: { params: any }) {
  try {
    const resolvedParams = await params;
    const id = resolvedParams?.id;
    const body = await request.json();
    const { status, paymentStatus } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing order ID" }, { status: 400 });
    }

    // Dynamic environment resilience: if database configuration is missing on client/vercel deploy,
    // seamlessly forward the request to the Express Backend which holds full server connections!
    const hasDbEnv = process.env.SQL_HOST && process.env.SQL_USER && process.env.SQL_PASSWORD;
    if (!hasDbEnv) {
      console.log(`[Next.js API] Missing database env. Proxying update-status request to Express Backend for order ID: ${id}`);
      const backendUrl = process.env.BACKEND_URL || "http://localhost:3000";
      const forwardRes = await fetch(`${backendUrl}/api/orders/${id}/update-status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const data = await forwardRes.json();
      return NextResponse.json(data, { status: forwardRes.status });
    }

    const list = await db.select().from(orders).where(eq(orders.id, id));
    if (list.length === 0) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    const order = list[0];

    const prevStatus = order.status;
    const updates: any = {};
    if (status) updates.status = status;
    if (paymentStatus) updates.paymentStatus = paymentStatus;

    await db.update(orders).set(updates).where(eq(orders.id, id));
    const updatedOrder = { ...order, ...updates };

    // If order is completed or processed, the SIM is permanently SOLD
    if (status === "Đã hoàn thành" || status === "Đang giao" || status === "Đang xử lý") {
      await db.update(sims).set({ status: "Đã bán" }).where(eq(sims.id, order.simId));
      
      // Calculate commission on completion if not previous fully accounted
      if (prevStatus === "Chờ duyệt" && order.agentId && (paymentStatus === "Đã thanh toán" || order.paymentStatus === "Đã thanh toán")) {
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
    } else if (status === "Đã hủy") {
      await db.update(sims).set({ status: "Còn hàng" }).where(eq(sims.id, order.simId));
    }

    return NextResponse.json({ success: true, order: updatedOrder });
  } catch (err: any) {
    console.error("POST /api/orders/[id]/update-status error:", err);

    // Ultimate fallback rescue mechanism: forward to Express backend if any SQL or database connection fails
    try {
      const resolvedParams = await params;
      const id = resolvedParams?.id;
      if (id) {
        console.log(`[Next.js API Fallback] DB execution failed. Forwarding update-status request to Express Backend as backup for order ID: ${id}`);
        const backendUrl = process.env.BACKEND_URL || "http://localhost:3000";
        const forwardRes = await fetch(`${backendUrl}/api/orders/${id}/update-status`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body)
        });
        const data = await forwardRes.json();
        return NextResponse.json(data, { status: forwardRes.status });
      }
    } catch (fallbackErr: any) {
      console.error("Next.js update-status proxy fallback rescue failed:", fallbackErr);
    }

    return NextResponse.json({ error: "Status update failed." }, { status: 500 });
  }
}
