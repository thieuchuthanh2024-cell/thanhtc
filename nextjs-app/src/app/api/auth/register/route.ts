import { NextResponse } from "next/server";
import { db } from "@/db";
import { agents } from "@/db/schema";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, phone, email, password, role } = body;

    if (!name || !phone || !email || !password || !role) {
      return NextResponse.json({ error: "Vui lòng điền đầy đủ tất cả các trường." }, { status: 400 });
    }

    const list = await db.select().from(agents);
    const exists = list.some(
      a => a.email.toLowerCase() === email.trim().toLowerCase() || a.phone === phone.trim()
    );

    if (exists) {
      return NextResponse.json({ error: "Email hoặc Số điện thoại đã được sử dụng." }, { status: 400 });
    }

    let discountRate = 0.10;
    if (role === "Đại lý cấp 1") discountRate = 0.20;
    else if (role === "Đại lý cấp 2") discountRate = 0.15;

    const newAgent = {
      id: "agent_" + Math.random().toString(36).substring(2, 9),
      name,
      phone,
      email,
      password,
      role,
      discountRate,
      commissionEarned: 0,
      totalSales: 0,
    };

    await db.insert(agents).values(newAgent);
    return NextResponse.json({ success: true, agent: newAgent });
  } catch (err: any) {
    console.error("POST /api/auth/register error:", err);
    return NextResponse.json({ error: "Đăng ký thất bại." }, { status: 500 });
  }
}
