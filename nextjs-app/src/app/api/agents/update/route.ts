import { NextResponse } from "next/server";
import { db } from "@/db";
import { agents } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, name, role, discountRate, phone, email, password } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing Agent ID" }, { status: 400 });
    }

    const list = await db.select().from(agents).where(eq(agents.id, id));
    if (list.length > 0) {
      await db.update(agents).set({
        name,
        role,
        discountRate: parseFloat(discountRate),
        phone,
        email,
        password: password || undefined,
      }).where(eq(agents.id, id));
    } else {
      await db.insert(agents).values({
        id,
        name,
        role,
        discountRate: parseFloat(discountRate),
        phone,
        email,
        password: password || "123456",
        commissionEarned: 0,
        totalSales: 0,
      });
    }

    const updatedList = await db.select().from(agents);
    return NextResponse.json({ success: true, agents: updatedList });
  } catch (err: any) {
    console.error("POST /api/agents/update error:", err);
    return NextResponse.json({ error: "Failed to save agent." }, { status: 500 });
  }
}
