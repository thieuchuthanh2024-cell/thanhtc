import { NextResponse } from "next/server";

export async function GET() {
  const task = (globalThis as any).activeGenerationTask || {
    id: "",
    total: 0,
    inserted: 0,
    status: "idle",
    error: null,
    durationMs: 0,
    startTime: 0,
  };
  return NextResponse.json(task);
}
