import { NextResponse } from "next/server";
import { db } from "@/db";
import { sims } from "@/db/schema";
import { eq, and, gte, lte, like, or } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const carrier = searchParams.get("carrier");
    const category = searchParams.get("category");
    const query = searchParams.get("q");
    const minPriceStr = searchParams.get("minPrice");
    const maxPriceStr = searchParams.get("maxPrice");
    const limitStr = searchParams.get("limit");

    const conditions: any[] = [eq(sims.status, "Còn hàng")];

    if (carrier && carrier !== "All") {
      conditions.push(eq(sims.carrier, carrier));
    }
    if (category && category !== "All") {
      conditions.push(eq(sims.category, category));
    }
    if (query) {
      const cleanQ = query.replace(/\D/g, "");
      if (cleanQ) {
        conditions.push(like(sims.searchableNumber, `%${cleanQ}%`));
      } else {
        conditions.push(like(sims.number, `%${query}%`));
      }
    }
    if (minPriceStr) {
      const minP = parseFloat(minPriceStr);
      if (!isNaN(minP)) conditions.push(gte(sims.price, minP));
    }
    if (maxPriceStr) {
      const maxP = parseFloat(maxPriceStr);
      if (!isNaN(maxP)) conditions.push(lte(sims.price, maxP));
    }

    const limitVal = limitStr ? parseInt(limitStr, 10) : 50;

    const results = await db
      .select()
      .from(sims)
      .where(and(...conditions))
      .limit(limitVal);

    return NextResponse.json(results);
  } catch (err: any) {
    console.error("GET /api/sims error:", err);
    return NextResponse.json({ error: "Failed to fetch Sims" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, number, carrier, price, category, sum } = body;

    if (!id || !number || !carrier || !price || !category) {
      return NextResponse.json({ error: "Missing required sim fields" }, { status: 400 });
    }

    const searchableNumber = number.replace(/\D/g, "");

    await db.insert(sims).values({
      id,
      number,
      searchableNumber,
      carrier,
      price: parseFloat(price),
      category,
      status: "Còn hàng",
      sum: sum || 10,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("POST /api/sims error:", err);
    return NextResponse.json({ error: "Failed to save Sim" }, { status: 500 });
  }
}
