import { NextResponse } from "next/server";
import { db } from "@/db";
import { packages } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PUT(request: Request, { params }: { params: any }) {
  try {
    const resolvedParams = await params;
    const id = resolvedParams.id;
    const body = await request.json();
    const { networkId, name, monthlyFee, minutesInternal, minutesExternal, smsInternal, smsExternal, dataGb, dataLimitText, outOfBundleCharge, isMandatory } = body;

    if (!networkId || !name || monthlyFee === undefined) {
      return NextResponse.json({ error: "Thiếu thông tin bắt buộc." }, { status: 400 });
    }

    await db.update(packages).set({
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
    }).where(eq(packages.id, id));

    return NextResponse.json({
      success: true,
      package: { id, networkId, name, monthlyFee, minutesInternal, minutesExternal, smsInternal, smsExternal, dataGb, dataLimitText, outOfBundleCharge, isMandatory }
    });
  } catch (err: any) {
    console.error("PUT /api/packages/[id] error:", err);
    return NextResponse.json({ error: "Lỗi cập nhật gói cước: " + err.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: any }) {
  try {
    const resolvedParams = await params;
    const id = resolvedParams.id;

    await db.delete(packages).where(eq(packages.id, id));
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("DELETE /api/packages/[id] error:", err);
    return NextResponse.json({ error: "Lỗi xóa gói cước: " + err.message }, { status: 500 });
  }
}
