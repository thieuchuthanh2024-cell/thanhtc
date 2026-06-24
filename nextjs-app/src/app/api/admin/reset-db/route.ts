import { NextResponse } from "next/server";
import { db } from "@/db";
import { agents, sims, orders, deletedSims, packages, networks } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { seedDatabaseIfEmpty } from "@/db/seed";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { password } = body;

    if (!password) {
      return NextResponse.json({ error: "Thiếu mật khẩu xác nhận Admin." }, { status: 400 });
    }

    // Check admin power
    const admins = await db.select().from(agents).where(eq(agents.role, "Admin")).limit(1);
    const adminPass = admins[0]?.password || "admin123";
    if (password !== adminPass) {
      return NextResponse.json({ error: "Mật khẩu Admin không chính xác. Không có quyền xóa kho số!" }, { status: 401 });
    }

    // Direct delete
    await db.execute(sql`DELETE FROM ${orders}`);
    await db.execute(sql`DELETE FROM ${deletedSims}`);
    await db.execute(sql`DELETE FROM ${sims}`);
    await db.execute(sql`DELETE FROM ${packages}`);
    await db.execute(sql`DELETE FROM ${networks}`);

    // Immediately re-seed
    await seedDatabaseIfEmpty();

    return NextResponse.json({
      success: true,
      message: "Đã xoá sạch toàn bộ dữ liệu và tái lập thành công danh mục nhà mạng, gói cước và kho số mẫu!"
    });
  } catch (err: any) {
    console.error("POST /api/admin/reset-db error:", err);
    return NextResponse.json({ error: "Lỗi hệ thống khi khôi phục trắng: " + err.message }, { status: 500 });
  }
}
