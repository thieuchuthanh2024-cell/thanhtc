import { NextResponse } from "next/server";
import { db } from "@/db";
import { orders, agents } from "@/db/schema";

export async function GET() {
  try {
    const listOrders = await db.select().from(orders);
    const listAgents = await db.select().from(agents);

    const carrierDistribution: Record<string, { count: number; value: number }> = {};
    const agentRankings: Record<string, { sales: number; commission: number; name: string; role: string }> = {};
    const monthlyRevenue: Record<string, number> = {};

    let totalRevenue = 0;
    let completedSales = 0;
    let activeBookings = 0;

    listOrders.forEach(order => {
      if (order.status === "Đã hủy") return;

      const price = order.price;
      const paymentCompleted = order.paymentStatus === "Đã thanh toán";

      if (order.status === "Đã hoàn thành") {
        completedSales += price;
      } else {
        activeBookings += price;
      }

      if (paymentCompleted) {
        totalRevenue += order.discountPrice;
      }

      const cr = order.carrier || "Dịch vụ khác";
      if (!carrierDistribution[cr]) {
        carrierDistribution[cr] = { count: 0, value: 0 };
      }
      carrierDistribution[cr].count++;
      carrierDistribution[cr].value += price;

      if (order.agentId) {
        const agId = order.agentId;
        if (!agentRankings[agId]) {
          agentRankings[agId] = { sales: 0, commission: 0, name: order.customerName, role: order.agentRole || "Cộng tác viên" };
        }
        agentRankings[agId].sales += price;
        agentRankings[agId].commission += (price - order.discountPrice);
      }

      const month = order.createdAt.slice(0, 7); // "YYYY-MM"
      monthlyRevenue[month] = (monthlyRevenue[month] || 0) + (paymentCompleted ? order.discountPrice : 0);
    });

    listAgents.forEach(ag => {
      if (agentRankings[ag.id]) {
        agentRankings[ag.id].name = ag.name;
        agentRankings[ag.id].role = ag.role;
      }
    });

    const summary = {
      totalRevenue,
      completedSales,
      activeBookings,
      orderCount: listOrders.length,
      carrierChart: Object.entries(carrierDistribution).map(([name, val]) => ({ name, value: val.value, count: val.count })),
      agentChart: Object.entries(agentRankings).map(([id, val]) => ({ id, name: val.name, role: val.role, sales: val.sales, commission: val.commission })),
      timelineChart: Object.entries(monthlyRevenue).map(([month, rev]) => ({ name: month, revenue: rev })).sort((a, b) => a.name.localeCompare(b.name))
    };

    return NextResponse.json(summary);
  } catch (err: any) {
    console.error("GET /api/reports error:", err);
    return NextResponse.json({ error: "Failed to construct report dataset." }, { status: 500 });
  }
}
