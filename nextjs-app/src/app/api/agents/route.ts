import { NextResponse } from "next/server";
import { db } from "@/db";
import { agents } from "@/db/schema";

export async function GET() {
  try {
    const list = await db.select().from(agents);
    return NextResponse.json(list);
  } catch (err: any) {
    console.error("GET /api/agents error:", err);
    return NextResponse.json({ error: "Failed to load agents." }, { status: 500 });
  }
}
