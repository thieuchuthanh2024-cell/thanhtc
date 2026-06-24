import { NextResponse } from "next/server";
import { db } from "@/db";
import { networks } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PUT(request: Request, { params }: { params: any }) {
  try {
    const resolvedParams = await params;
    const id = resolvedParams.id;
    const body = await request.json();
    const { name, logo, notes } = body;

    if (!name) {
      return NextResponse.json({ error: "Tên nhà mạng không được rỗng." }, { status: 400 });
    }

    await db.update(networks).set({ name, logo, notes }).where(eq(networks.id, id));
    return NextResponse.json({ success: true, network: { id, name, logo, notes } });
  } catch (err: any) {
    console.error("PUT /api/networks/[id] error:", err);
    return NextResponse.json({ error: "Lỗi cập nhật nhà mạng: " + err.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: any }) {
  try {
    const resolvedParams = await params;
    const id = resolvedParams.id;

    await db.delete(networks).where(eq(networks.id, id));
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("DELETE /api/networks/[id] error:", err);
    return NextResponse.json({ error: "Lỗi xóa nhà mạng: " + err.message }, { status: 500 });
  }
}
