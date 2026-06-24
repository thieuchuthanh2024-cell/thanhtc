import { NextResponse } from "next/server";
import { db } from "@/db";
import { orders, sims, agents } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: Request, { params }: { params: any }) {
  try {
    const resolvedParams = await params;
    const id = resolvedParams.id;

    const list = await db.select().from(orders).where(eq(orders.id, id));
    if (list.length === 0) {
      return NextResponse.json({ error: "Không tìm thấy đơn hàng." }, { status: 404 });
    }
    const order = list[0];

    // Lock SIM to SOLD status
    await db.update(sims).set({ status: "Đã bán" }).where(eq(sims.id, order.simId));

    // Update Order payment and status
    await db.update(orders).set({
      paymentStatus: "Đã thanh toán",
      status: "Đang xử lý"
    }).where(eq(orders.id, id));

    // Accumulate Agent sales/commissions
    if (order.agentId) {
      const agentList = await db.select().from(agents).where(eq(agents.id, order.agentId));
      if (agentList.length > 0) {
        const agent = agentList[0];
        const commission = order.price - order.discountPrice;
        await db.update(agents).set({
          commissionEarned: agent.commissionEarned + commission,
          totalSales: agent.totalSales + order.price
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
    return NextResponse.json({ error: "Simulation failed." }, { status: 500 });
  }
}
