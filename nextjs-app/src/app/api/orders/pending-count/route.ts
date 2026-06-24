import { NextResponse } from "next/server";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export async function GET() {
  try {
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(eq(orders.status, "Chờ duyệt"));
    const count = Number(result[0]?.count || 0);
    return NextResponse.json({ count });
  } catch (err: any) {
    console.error("GET /api/orders/pending-count error:", err);
    return NextResponse.json({ error: "Failed to fetch pending order count." }, { status: 500 });
  }
}
