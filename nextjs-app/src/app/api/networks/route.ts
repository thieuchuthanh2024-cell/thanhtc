import { NextResponse } from "next/server";
import { db } from "@/db";
import { networks } from "@/db/schema";
import { asc, eq } from "drizzle-orm";

export async function GET() {
  try {
    const list = await db.select().from(networks).orderBy(asc(networks.id));
    return NextResponse.json(list);
  } catch (err: any) {
    console.error("GET /api/networks error:", err);
    return NextResponse.json({ error: "Failed to load networks registry." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, name, logo, notes } = body;

    if (!id || !name) {
      return NextResponse.json({ error: "Thiếu thông tin ID hoặc Tên nhà mạng." }, { status: 400 });
    }

    const cleanId = id.toLowerCase().trim();
    const existing = await db.select().from(networks).where(eq(networks.id, cleanId));
    if (existing.length > 0) {
      return NextResponse.json({ error: "Mã nhà mạng này đã tồn tại." }, { status: 400 });
    }

    const newNetwork = { id: cleanId, name, logo, notes };
    await db.insert(networks).values(newNetwork);
    return NextResponse.json({ success: true, network: newNetwork });
  } catch (err: any) {
    console.error("POST /api/networks error:", err);
    return NextResponse.json({ error: "Lỗi lưu nhà mạng: " + err.message }, { status: 500 });
  }
}
