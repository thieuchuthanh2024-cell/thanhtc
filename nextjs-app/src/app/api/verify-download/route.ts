import { NextResponse } from "next/server";

if (!(globalThis as any).activeDownloadTokens) {
  (globalThis as any).activeDownloadTokens = new Set<string>();
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { password } = body;

    if (password === "Thanh@admin") {
      const token = Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
      (globalThis as any).activeDownloadTokens.add(token);

      // Token automatically expires in 30 seconds
      setTimeout(() => {
        if ((globalThis as any).activeDownloadTokens) {
          (globalThis as any).activeDownloadTokens.delete(token);
        }
      }, 30000);

      return NextResponse.json({ success: true, token });
    } else {
      return NextResponse.json({ error: "Mật khẩu không chính xác. Vui lòng kiểm tra lại!" }, { status: 403 });
    }
  } catch (err: any) {
    console.error("POST /api/verify-download error:", err);
    return NextResponse.json({ error: "Lỗi hệ thống xác thực tệp: " + err.message }, { status: 500 });
  }
}
