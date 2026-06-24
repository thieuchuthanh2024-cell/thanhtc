import { NextResponse } from "next/server";
import { db } from "@/db";
import { packages } from "@/db/schema";
import { asc, eq } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const networkId = searchParams.get("networkId");

    let list;
    if (networkId && networkId !== "All") {
      list = await db.select().from(packages).where(eq(packages.networkId, networkId)).orderBy(asc(packages.monthlyFee));
    } else {
      list = await db.select().from(packages).orderBy(asc(packages.monthlyFee));
    }
    return NextResponse.json(list);
  } catch (err: any) {
    console.error("GET /api/packages error:", err);
    return NextResponse.json({ error: "Failed to load packages." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, networkId, name, monthlyFee, minutesInternal, minutesExternal, smsInternal, smsExternal, dataGb, dataLimitText, outOfBundleCharge, isMandatory } = body;

    if (!networkId || !name || monthlyFee === undefined) {
      return NextResponse.json({ error: "Thiếu thông tin bắt buộc (Nhà mạng, Tên gói, Giá)." }, { status: 400 });
    }

    const cleanId = id || "pkg-" + Math.floor(Math.random() * 90000 + 10000);
    const newPkg = {
      id: cleanId,
      networkId,
      name,
      monthlyFee: parseFloat(monthlyFee) || 0,
      minutesInternal: parseInt(minutesInternal, 10) || 0,
      minutesExternal: parseInt(minutesExternal, 10) || 0,
      smsInternal: parseInt(smsInternal, 10) || 0,
      smsExternal: parseInt(smsExternal, 10) || 0,
      dataGb: parseFloat(dataGb) || 0,
      dataLimitText: dataLimitText || "",
      outOfBundleCharge: outOfBundleCharge || "",
      isMandatory: !!isMandatory
    };

    await db.insert(packages).values(newPkg);
    return NextResponse.json({ success: true, package: newPkg });
  } catch (err: any) {
    console.error("POST /api/packages error:", err);
    return NextResponse.json({ error: "Lỗi lưu gói cước: " + err.message }, { status: 500 });
  }
}
