import { NextResponse } from "next/server";
import { db } from "@/db";
import { sql } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { password, query } = body;

    if (password !== "Thanh@admin") {
      return NextResponse.json({ success: false, error: "Mật khẩu quản trị viên không chính xác!" }, { status: 401 });
    }

    if (!query || typeof query !== "string" || query.trim() === "") {
      return NextResponse.json({ success: false, error: "Câu lệnh SQL không hợp lệ!" }, { status: 400 });
    }

    const result = await db.execute(sql.raw(query));
    
    return NextResponse.json({
      success: true,
      rows: result.rows || [],
      rowCount: result.rowCount ?? (result.rows ? result.rows.length : 0),
      fields: result.fields || []
    });
  } catch (err: any) {
    console.error("POST /api/admin/execute-sql error:", err);
    return NextResponse.json({ success: false, error: err?.message || "Lỗi cú pháp hoặc lỗi khi thực thi SQL." }, { status: 500 });
  }
}
