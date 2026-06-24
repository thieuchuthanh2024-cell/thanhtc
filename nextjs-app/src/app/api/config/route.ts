import { NextResponse } from "next/server";
import { readSecrets } from "@/utils/secrets";

export async function GET() {
  try {
    const allowSimulation = process.env.ALLOW_ROLE_SIMULATION !== "false";
    const secrets = await readSecrets();
    return NextResponse.json({ allowSimulation, secrets });
  } catch (err: any) {
    console.error("GET /api/config error:", err);
    return NextResponse.json({ error: "Failed to load system config." }, { status: 500 });
  }
}
