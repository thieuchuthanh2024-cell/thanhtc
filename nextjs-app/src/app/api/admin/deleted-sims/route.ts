import { NextResponse } from "next/server";
import { db } from "@/db";
import { deletedSims } from "@/db/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  try {
    const list = await db.select().from(deletedSims).orderBy(desc(deletedSims.deletedAt)).limit(100);
    return NextResponse.json(list);
  } catch (err: any) {
    console.error("GET /api/admin/deleted-sims error:", err);
    return NextResponse.json({ error: "Lỗi tải lịch sử SIM bị xóa: " + err.message }, { status: 500 });
  }
}
