import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    SQL_HOST: process.env.SQL_HOST || "127.0.0.1",
    SQL_USER: process.env.SQL_USER || "postgres",
    SQL_DB_NAME: process.env.SQL_DB_NAME || "postgres",
    SQL_PORT: "5432"
  });
}
