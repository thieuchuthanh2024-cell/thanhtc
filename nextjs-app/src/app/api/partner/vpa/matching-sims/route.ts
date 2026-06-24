import { NextResponse } from "next/server";
import { db } from "@/db";
import { sims } from "@/db/schema";
import { eq, and, like, or } from "drizzle-orm";

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

async function handleMatchingSims(licensePlate: string | null) {
  if (!licensePlate) {
    return NextResponse.json({
      success: false,
      error: "Missing required query/body parameter 'plate' or 'licensePlate'. E.g. /api/partner/vpa/matching-sims?plate=29AF12039"
    }, { status: 400 });
  }

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

  const conditions = [eq(sims.status, "Còn hàng")];
  if (subconditions.length > 0) {
    conditions.push(or(...subconditions));
  } else {
    const cleanDigits = licensePlate.replace(/\D/g, "");
    if (cleanDigits) {
      conditions.push(like(sims.searchableNumber, `%${cleanDigits}%`));
    }
  }

  const whereClause = and(...conditions);

  // Fetch potential matching base SIMs with a large candidate pool of 2000 to search thoroughly
  let list = await db.select().from(sims).where(whereClause).limit(2000);

  // Robust Fallback: If no strict matches are found in the database, 
  // retrieve a healthy pool of up to 2000 available SIMs to compute the best compatible results dynamically!
  if (list.length < 5) {
    list = await db.select().from(sims).where(eq(sims.status, "Còn hàng")).limit(2000);
  }

  // Dynamic scoring formula matching to find the top 5 closest SIMs
  const scoredItems = list.map(sim => {
    let score = 0;
    const simNum = sim.searchableNumber;

    // Base score ensure no available number is filtered out
    score += 10;

    // 1. Exact suffix matching
    if (parsed.number && simNum.endsWith(parsed.number)) {
      score += 1000 + parsed.number.length * 20;
    } else if (parsed.suffix4 && simNum.endsWith(parsed.suffix4)) {
      score += 800;
    } else if (parsed.suffix3 && simNum.endsWith(parsed.suffix3)) {
      score += 550;
    } else if (parsed.suffix2 && simNum.endsWith(parsed.suffix2)) {
      score += 450;
    }

    // 2. Substring matching inside the numbers
    if (parsed.number && simNum.includes(parsed.number)) {
      score += 400;
    } else if (parsed.suffix4 && simNum.includes(parsed.suffix4)) {
      score += 250;
    } else if (parsed.suffix3 && simNum.includes(parsed.suffix3)) {
      score += 180;
    } else if (parsed.suffix2 && simNum.includes(parsed.suffix2)) {
      score += 200;
    }

    // 3. Digit Overlap matching (Dynamic similarity)
    const plateDigits = licensePlate.replace(/\D/g, "");
    let digitHits = 0;
    for (const char of plateDigits) {
      if (simNum.includes(char)) {
        digitHits++;
      }
    }
    score += digitHits * 15;

    // 4. Matched province code suffix or prefix alignment
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

    // 5. Feng shui node sum compatibility
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

    // 6. Category aesthetic value boost
    if (sim.category === "Thần Tài" || sim.category === "Lộc Phát") {
      score += 25;
    } else if (sim.category === "Sảnh Tiến") {
      score += 20;
    }

    return { sim, score };
  })
  .sort((a, b) => b.score - a.score)
  .slice(0, 5);

  return NextResponse.json({
    success: true,
    partner: "VPA - Vietnam Partnership Auction",
    partnerWebsite: "https://dgbs.vpa.com.vn/",
    inputPlate: licensePlate,
    parsedAnalysis: {
      province: parsed.province,
      series: parsed.series,
      numberBlock: parsed.number,
      suffix4Digits: parsed.suffix4,
      suffix3Digits: parsed.suffix3,
      suffix2Digits: parsed.suffix2
    },
    explanation: "API này cung cấp 5 số SIM có độ tương đồng cao nhất, bổ trợ phong thuỷ hoàn hảo cho biển số xe của bạn.",
    count: scoredItems.length,
    sims: scoredItems.map(item => ({
      id: item.sim.id,
      number: item.sim.number,
      carrier: item.sim.carrier,
      category: item.sim.category,
      price: item.sim.price,
      sum: item.sim.sum,
      similarityScore: item.score
    }))
  });
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const licensePlate = searchParams.get("plate") || searchParams.get("licensePlate");
    return await handleMatchingSims(licensePlate);
  } catch (err: any) {
    console.error("VPA integration lookup error (NextJS GET):", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    let licensePlate: string | null = null;
    try {
      const body = await request.json();
      licensePlate = body.plate || body.licensePlate;
    } catch (e) {
      // Body may be empty or not valid JSON
    }

    if (!licensePlate) {
      const { searchParams } = new URL(request.url);
      licensePlate = searchParams.get("plate") || searchParams.get("licensePlate");
    }

    return await handleMatchingSims(licensePlate);
  } catch (err: any) {
    console.error("VPA integration lookup error (NextJS POST):", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
