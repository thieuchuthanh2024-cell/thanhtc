import { NextResponse } from "next/server";
import { db } from "@/db";
import { sims, packages } from "@/db/schema";
import { eq, and, gte, lte, like, or, ne, asc, desc, sql } from "drizzle-orm";

// Robust helper to parse Vietnam license plates (e.g., 29AF12039, 30F-999.99)
function parseLicensePlate(plate: string) {
  const clean = plate.replace(/[\s\.\-\,]/g, "").toUpperCase();
  const regMatch = clean.match(/^(\d{2})([A-Z]{1,2})(\d{4,5})$/);
  if (regMatch) {
    const province = regMatch[1];
    const series = regMatch[2];
    const number = regMatch[3];
    return {
      success: true,
      clean,
      province,
      series,
      number,
      suffix4: number.slice(-4),
      suffix3: number.slice(-3),
      suffix2: number.slice(-2)
    };
  }

  // Fallback for custom formatted plates preserving digits
  const cleanDigits = clean.replace(/\D/g, "");
  if (cleanDigits.length >= 4) {
    return {
      success: true,
      clean,
      province: cleanDigits.slice(0, 2),
      series: "",
      number: cleanDigits.slice(2),
      suffix4: cleanDigits.slice(-4),
      suffix3: cleanDigits.slice(-3),
      suffix2: cleanDigits.slice(-2)
    };
  }

  return {
    success: false,
    clean,
    province: "",
    series: "",
    number: cleanDigits,
    suffix4: cleanDigits,
    suffix3: cleanDigits,
    suffix2: cleanDigits
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const carrier = searchParams.get("carrier");
    const category = searchParams.get("category");
    const priceRange = searchParams.get("priceRange");
    const priceMinStr = searchParams.get("priceMin");
    const priceMaxStr = searchParams.get("priceMax");
    const status = searchParams.get("status");
    const sumRange = searchParams.get("sumRange");
    const sumMinStr = searchParams.get("sumMin");
    const sumMaxStr = searchParams.get("sumMax");
    const licensePlate = searchParams.get("licensePlate");
    const sortBy = searchParams.get("sortBy");

    const paginated = searchParams.get("paginated") === "true" || !!searchParams.get("page");
    const page = Math.max(parseInt(searchParams.get("page") || "1", 10) || 1, 1);
    const limit = paginated 
      ? Math.min(Math.max(parseInt(searchParams.get("limit") || "24", 10) || 24, 1), 100)
      : 150; // Safety cap to avoid crash
    const offset = (page - 1) * limit;

    const conditions: any[] = [];

    // 1. Search Query parsing
    if (search) {
      const cleanSearch = search.replace(/\D/g, "");
      if (cleanSearch) {
        if (search.includes("*")) {
          const sqlPattern = search.replace(/\*/g, "%");
          conditions.push(like(sims.searchableNumber, sqlPattern));
        } else {
          conditions.push(like(sims.searchableNumber, `%${cleanSearch}%`));
        }
      } else {
        conditions.push(or(
          like(sql`lower(${sims.carrier})`, `%${search.toLowerCase()}%`),
          like(sql`lower(${sims.category})`, `%${search.toLowerCase()}%`)
        ));
      }
    }

    // 2. Carrier filter
    if (carrier && carrier !== "All") {
      const lowerCarrier = carrier.toLowerCase().trim();
      let matchedCarrier = carrier;
      if (lowerCarrier === "viettel") matchedCarrier = "Viettel";
      else if (lowerCarrier === "vinaphone" || lowerCarrier === "vina") matchedCarrier = "Vinaphone";
      else if (lowerCarrier === "mobifone" || lowerCarrier === "mobi") matchedCarrier = "Mobifone";
      else if (lowerCarrier === "vietnamobile") matchedCarrier = "Vietnamobile";
      else if (lowerCarrier === "itelecom") matchedCarrier = "Itelecom";
      else if (lowerCarrier === "wintel") matchedCarrier = "Wintel";
      else {
        matchedCarrier = carrier.trim().charAt(0).toUpperCase() + carrier.trim().slice(1);
      }
      conditions.push(eq(sims.carrier, matchedCarrier));
    }

    // 3. Category filter
    if (category && category !== "All") {
      conditions.push(eq(sims.category, category));
    }

    // 4. Price range calculation
    let finalPriceMin = priceMinStr ? parseInt(priceMinStr, 10) : null;
    let finalPriceMax = priceMaxStr ? parseInt(priceMaxStr, 10) : null;
    if (priceRange && priceRange !== "All") {
      if (priceRange === "under-3m") {
        finalPriceMax = 2999999;
      } else if (priceRange === "3m-10m") {
        finalPriceMin = 3000000;
        finalPriceMax = 10000000;
      } else if (priceRange === "10m-50m") {
        finalPriceMin = 10000001;
        finalPriceMax = 50000000;
      } else if (priceRange === "50m-200m") {
        finalPriceMin = 50000001;
        finalPriceMax = 200000000;
      } else if (priceRange === "above-200m") {
        finalPriceMin = 200000001;
      }
    }

    if (finalPriceMin !== null && finalPriceMin !== undefined) {
      conditions.push(gte(sims.price, finalPriceMin));
    }
    if (finalPriceMax !== null && finalPriceMax !== undefined) {
      conditions.push(lte(sims.price, finalPriceMax));
    }

    // 5. Status filter
    if (status && status === "Active") {
      conditions.push(ne(sims.status, "Đã bán"));
    } else if (status && status !== "All") {
      conditions.push(eq(sims.status, status));
    } else if (!status) {
      conditions.push(ne(sims.status, "Đã bán"));
    }

    // 6. Sum Range mapping (Tổng nút)
    let finalSumMin = sumMinStr ? parseInt(sumMinStr, 10) : null;
    let finalSumMax = sumMaxStr ? parseInt(sumMaxStr, 10) : null;
    if (sumRange && sumRange !== "All") {
      const parts = sumRange.split("-").map(Number);
      if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        finalSumMin = parts[0];
        finalSumMax = parts[1];
      }
    }

    if (finalSumMin !== null && finalSumMin !== undefined) {
      conditions.push(gte(sims.sum, finalSumMin));
    }
    if (finalSumMax !== null && finalSumMax !== undefined) {
      conditions.push(lte(sims.sum, finalSumMax));
    }

    // Define items list & total length variables first
    let items: any[] = [];
    let totalCount = 0;

    // Sorting order
    let order: any[] = [];
    if (sortBy === "price-asc") {
      order.push(asc(sims.price));
    } else if (sortBy === "price-desc") {
      order.push(desc(sims.price));
    } else if (sortBy === "sum-desc") {
      order.push(desc(sims.sum));
    } else if (sortBy === "sum-asc") {
      order.push(asc(sims.sum));
    } else {
      order.push(asc(sims.price));
    }

    if (licensePlate) {
      const parsed = parseLicensePlate(licensePlate);
      const subconditions: any[] = [];
      if (parsed.number && parsed.number.length >= 3) {
        subconditions.push(like(sims.searchableNumber, `%${parsed.number}%`));
      }
      if (parsed.suffix4 && parsed.suffix4.length >= 3) {
        subconditions.push(like(sims.searchableNumber, `%${parsed.suffix4}%`));
      }
      if (parsed.suffix3 && parsed.suffix3.length >= 3) {
        subconditions.push(like(sims.searchableNumber, `%${parsed.suffix3}%`));
      }
      if (parsed.suffix2 && parsed.suffix2.length >= 2) {
        subconditions.push(like(sims.searchableNumber, `%${parsed.suffix2}%`));
      }

      const plateConditions = [...conditions];
      if (subconditions.length > 0) {
        plateConditions.push(or(...subconditions));
      } else {
        const cleanDigits = licensePlate.replace(/\D/g, "");
        if (cleanDigits.length >= 2) {
          plateConditions.push(like(sims.searchableNumber, `%${cleanDigits}%`));
        }
      }

      const strictWhere = and(...plateConditions);
      let list = await db.select().from(sims).where(strictWhere).orderBy(...order).limit(2000);

      // Robust Fallback: If no strict substring match resides in the DB, 
      // look up all available sims matching the rest of the search criteria and rank them!
      if (list.length < 5) {
        const generalWhere = conditions.length > 0 ? and(...conditions) : undefined;
        list = await db.select().from(sims).where(generalWhere).orderBy(...order).limit(2000);
      }

      // Apply the dynamic license plate ranking score compatibility matrix
      const scoredItems = list.map(sim => {
        let score = 0;
        const simNum = sim.searchableNumber;

        // Base score
        score += 10;

        // 1. Suffix matching
        if (parsed.number && simNum.endsWith(parsed.number)) {
          score += 1000 + parsed.number.length * 20;
        } else if (parsed.suffix4 && simNum.endsWith(parsed.suffix4)) {
          score += 800;
        } else if (parsed.suffix3 && simNum.endsWith(parsed.suffix3)) {
          score += 550;
        } else if (parsed.suffix2 && simNum.endsWith(parsed.suffix2)) {
          score += 450;
        }

        // 2. Substrings
        if (parsed.number && simNum.includes(parsed.number)) {
          score += 400;
        } else if (parsed.suffix4 && simNum.includes(parsed.suffix4)) {
          score += 250;
        } else if (parsed.suffix3 && simNum.includes(parsed.suffix3)) {
          score += 180;
        } else if (parsed.suffix2 && simNum.includes(parsed.suffix2)) {
          score += 200;
        }

        // 3. Digit alignment
        const plateDigits = licensePlate.replace(/\D/g, "");
        let digitHits = 0;
        for (const char of plateDigits) {
          if (simNum.includes(char)) {
            digitHits++;
          }
        }
        score += digitHits * 15;

        // 4. Province code prefix/suffix matching
        if (parsed.province) {
          if (simNum.startsWith("0" + parsed.province) || simNum.startsWith("03" + parsed.province) || simNum.startsWith("09" + parsed.province)) {
            score += 60;
          }
          if (simNum.endsWith(parsed.province)) {
            score += 80;
          }
          if (simNum.includes(parsed.province)) {
            score += 40;
          }
        }

        // 5. Total node compatibility
        const simSumUnit = sim.sum % 10;
        let plateSum = 0;
        for (let i = 0; i < plateDigits.length; i++) {
          plateSum += parseInt(plateDigits[i], 10);
        }
        const plateSumUnit = plateSum % 10;
        if (simSumUnit === plateSumUnit) {
          score += 50;
        } else if (Math.abs(simSumUnit - plateSumUnit) <= 1) {
          score += 20;
        }

        // 6. Aesthetic categorization boost
        if (sim.category === "Thần Tài" || sim.category === "Lộc Phát") {
          score += 25;
        } else if (sim.category === "Sảnh Tiến") {
          score += 20;
        }

        return { sim, score };
      });

      const sorted = scoredItems.sort((a, b) => b.score - a.score).map(x => x.sim);
      totalCount = sorted.length;
      items = sorted.slice(offset, offset + limit);
    } else {
      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
      const countRes = await db.select({ count: sql<number>`count(*)` }).from(sims).where(whereClause);
      totalCount = Number(countRes[0]?.count || 0);
      items = await db.select().from(sims).where(whereClause).orderBy(...order).limit(limit).offset(offset);
    }

    // Enrich with package details in-memory
    const allPkgs = await db.select().from(packages);
    const enrichedItems = items.map(sim => {
      const matchPkg = sim.mandatoryPackageId ? allPkgs.find(p => p.id === sim.mandatoryPackageId) : null;
      return {
        ...sim,
        mandatoryPackage: matchPkg || null
      };
    });

    if (paginated) {
      return NextResponse.json({
        items: enrichedItems,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page,
        limit
      });
    } else {
      return NextResponse.json(enrichedItems);
    }
  } catch (err: any) {
    console.error("GET /api/sims error:", err);
    return NextResponse.json({ error: "Failed to fetch Sims: " + err.message }, { status: 500 });
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
