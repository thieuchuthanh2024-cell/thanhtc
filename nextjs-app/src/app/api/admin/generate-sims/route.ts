import { NextResponse } from "next/server";
import { db } from "@/db";
import { agents } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

// Maintain state on globalThis to survive across NextJS Hot-Module Replaces & route invocations
if (!(globalThis as any).activeGenerationTask) {
  (globalThis as any).activeGenerationTask = {
    id: "",
    total: 0,
    inserted: 0,
    status: "idle",
    error: null,
    durationMs: 0,
    startTime: 0,
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { count, password } = body;

    if (count === undefined || !password) {
      return NextResponse.json({ error: "Thiếu tham số số lượng (count) hoặc mật khẩu Admin." }, { status: 400 });
    }

    // 1. Check admin power
    const admins = await db.select().from(agents).where(eq(agents.role, "Admin")).limit(1);
    const adminPass = admins[0]?.password || "admin123";
    if (password !== adminPass) {
      return NextResponse.json({ error: "Mật khẩu Admin không chính xác. Không có quyền sinh dữ liệu!" }, { status: 401 });
    }

    const numCount = parseInt(count, 10);
    if (isNaN(numCount) || numCount <= 0 || numCount > 3000000) {
      return NextResponse.json({ error: "Số lượng sim tạo ngẫu nhiên không hợp lệ (tối thiểu 1, tối đa 3.000.000)." }, { status: 400 });
    }

    const activeTask = (globalThis as any).activeGenerationTask;
    if (activeTask.status === "running") {
      return NextResponse.json({ error: "Hệ thống đang tiến hành sinh dữ liệu cho một tiến trình khác. Vui lòng đợi!" }, { status: 429 });
    }

    // Initialize the background task structure
    const updatedTask = {
      id: "task-" + Date.now(),
      total: numCount,
      inserted: 0,
      status: "running",
      error: null,
      durationMs: 0,
      startTime: Date.now(),
    };
    (globalThis as any).activeGenerationTask = updatedTask;

    // Spin off generation in background chunks to avoid blocking/timeouts and keep DB stable
    (async () => {
      try {
        const batchSize = 100000;
        let inserted = 0;
        let index = 1;

        while (inserted < numCount) {
          const currentBatchLimit = Math.min(batchSize, numCount - inserted);

          // We execute the same optimized raw PostgreSQL generation script
          const query = sql`
            INSERT INTO sims (id, number, searchable_number, carrier, network_id, mandatory_package_id, price, category, status, sum, is_hot, notes)
            SELECT 
              id, number, searchable_number, carrier,
              LOWER(carrier) AS network_id,
              CASE 
                WHEN price >= 50000000 AND LOWER(carrier) = 'viettel' THEN 'pkg-v200c'
                WHEN price >= 50000000 AND LOWER(carrier) = 'vinaphone' THEN 'pkg-vd149t'
                WHEN price >= 50000000 AND LOWER(carrier) = 'mobifone' THEN 'pkg-kc150'
                ELSE NULL
              END AS mandatory_package_id,
              price, category, status, sum, is_hot, notes
            FROM (
              SELECT 
                'sim-gen-' || ${index} || '-' || seq || '-' || floor(random() * 10000000)::integer AS id,
                '09' || r_num AS number,
                '09' || r_num AS searchable_number,
                carrier,
                price,
                (ARRAY['Tam Hoa', 'Tứ Quý', 'Ngũ Quý', 'Lộc Phát', 'Thần Tài', 'Sảnh Tiến', 'Sim Taxi', 'Thường'])[floor(random() * 8 + 1)] AS category,
                'Còn hàng' AS status,
                (
                  9 + 
                  (substring(r_num, 1, 1)::integer) + 
                  (substring(r_num, 2, 1)::integer) + 
                  (substring(r_num, 3, 1)::integer) + 
                  (substring(r_num, 4, 1)::integer) + 
                  (substring(r_num, 5, 1)::integer) + 
                  (substring(r_num, 6, 1)::integer) + 
                  (substring(r_num, 7, 1)::integer) + 
                  (substring(r_num, 8, 1)::integer)
                ) AS sum,
                false AS is_hot,
                'Hệ thống tự động sinh ngẫu nhiên' AS notes
              FROM (
                SELECT 
                  seq,
                  lpad((floor(random() * 90000000 + 10000000)::bigint)::text, 8, '0') AS r_num,
                  (ARRAY['Viettel', 'Vinaphone', 'Mobifone', 'Vietnamobile', 'Itelecom', 'Wintel'])[floor(random() * 6 + 1)] AS carrier,
                  (ARRAY[500000, 1000000, 2500000, 5000000, 15000000, 45000000, 120000000, 500000000])[floor(random() * 8 + 1)]::double precision AS price
                FROM generate_series(1, ${currentBatchLimit}) AS seq
              ) sub1
            ) sub2;
          `;

          await db.execute(query);
          inserted += currentBatchLimit;
          updatedTask.inserted = inserted;
          (globalThis as any).activeGenerationTask = { ...updatedTask };
          index++;

          // Yield CPU to let Node event loop handle other incoming network requests
          await new Promise(resolve => setTimeout(resolve, 50));
        }

        updatedTask.durationMs = Date.now() - updatedTask.startTime;
        updatedTask.status = "completed";
        (globalThis as any).activeGenerationTask = { ...updatedTask };
      } catch (err: any) {
        console.error("Error in background sim generation task:", err);
        updatedTask.status = "failed";
        updatedTask.error = err.message || "Lỗi PostgreSQL không xác định";
        (globalThis as any).activeGenerationTask = { ...updatedTask };
      }
    })();

    return NextResponse.json({
      success: true,
      message: "Tiến trình khởi tạo dữ liệu lớn đã được kích hoạt ngầm thành công!",
      taskId: updatedTask.id,
      total: numCount
    });
  } catch (err: any) {
    console.error("POST /api/admin/generate-sims error:", err);
    return NextResponse.json({ error: "Lỗi hệ thống khởi chạy tác vụ: " + err.message }, { status: 500 });
  }
}
