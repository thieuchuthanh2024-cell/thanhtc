import { NextResponse } from "next/server";
import { db } from "@/db";
import { agents } from "@/db/schema";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { credential, password } = body;

    if (!credential || !password) {
      return NextResponse.json({ error: "Vui lòng nhập đầy đủ thông tin đăng nhập." }, { status: 400 });
    }

    const list = await db.select().from(agents);
    const agent = list.find(
      a => a.email.toLowerCase() === credential.trim().toLowerCase() || a.phone === credential.trim()
    );

    if (!agent) {
      return NextResponse.json({ error: "Tài khoản không tồn tại hoặc chưa cài đặt mật khẩu." }, { status: 401 });
    }

    if (agent.password !== password) {
      return NextResponse.json({ error: "Mật khẩu sai. Vui lòng thử lại." }, { status: 401 });
    }

    return NextResponse.json({ success: true, agent });
  } catch (err: any) {
    console.error("POST /api/auth/login error:", err);
    return NextResponse.json({ error: "Đăng nhập thất bại." }, { status: 500 });
  }
}
