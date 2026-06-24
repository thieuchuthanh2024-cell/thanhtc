import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

if (!(globalThis as any).activeDownloadTokens) {
  (globalThis as any).activeDownloadTokens = new Set<string>();
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    const tokensSet = (globalThis as any).activeDownloadTokens;

    if (token && tokensSet.has(token)) {
      tokensSet.delete(token); // Single-use token

      const zipPath = path.join(process.cwd(), "nextjs_source_code.zip");
      if (fs.existsSync(zipPath)) {
        const fileBuffer = fs.readFileSync(zipPath);
        return new NextResponse(fileBuffer, {
          headers: {
            "Content-Type": "application/zip",
            "Content-Disposition": "attachment; filename=nextjs_source_code.zip",
          },
        });
      } else {
        return new NextResponse("Tệp tin nguồn .zip chưa được tạo hoặc không tồn tại!", { status: 404 });
      }
    } else {
      return new NextResponse("Mã tải tệp không hợp lệ hoặc đã hết hạn!", { status: 403 });
    }
  } catch (err: any) {
    console.error("GET /api/download-nextjs-zip error:", err);
    return new NextResponse("Lỗi tải tệp tin: " + err.message, { status: 500 });
  }
}
