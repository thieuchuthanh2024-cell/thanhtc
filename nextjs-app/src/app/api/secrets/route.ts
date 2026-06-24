import { NextResponse } from "next/server";
import { readSecrets, writeSecrets } from "@/utils/secrets";

export async function GET() {
  try {
    const secrets = await readSecrets();
    return NextResponse.json(secrets);
  } catch (err: any) {
    console.error("GET /api/secrets error:", err);
    return NextResponse.json({ error: "Failed to load secrets." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const current = await readSecrets();
    const updated = { ...current, ...body };
    await writeSecrets(updated);
    return NextResponse.json({ success: true, secrets: updated });
  } catch (err: any) {
    console.error("POST /api/secrets error:", err);
    return NextResponse.json({ error: err?.message || "Failed to update secrets." }, { status: 500 });
  }
}
