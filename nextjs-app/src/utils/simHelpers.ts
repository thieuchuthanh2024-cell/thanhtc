import { db } from "@/db";
import { networks } from "@/db/schema";
import { eq } from "drizzle-orm";

export function getDigitSum(numStr: string): number {
  return numStr.replace(/\D/g, "").split("").reduce((acc, digit) => acc + parseInt(digit, 10), 0);
}

export function formatSimNumber(numStr: string): string {
  const clean = numStr.replace(/\D/g, "");
  if (clean.length === 10) {
    return `${clean.slice(0, 4)}.${clean.slice(4, 7)}.${clean.slice(7)}`;
  }
  return clean;
}

export async function ensureNetworkExists(carrierName: string): Promise<string> {
  const nId = carrierName.toLowerCase().trim();
  const existing = await db.select({ id: networks.id }).from(networks).where(eq(networks.id, nId)).limit(1);
  if (existing.length === 0) {
    const brandColors = ["#1A202C", "#3182CE", "#319795", "#38A169", "#D69E2E", "#DD6B20", "#E53E3E"];
    const randColor = brandColors[Math.floor(Math.random() * brandColors.length)];
    await db.insert(networks).values({
      id: nId,
      name: carrierName.trim(),
      logo: randColor,
      notes: "Nhà mạng mới tự động cấu hình khi nhập kho số mới"
    });
    console.log(`[Dynamic Network Setup] Auto-created new network: ${carrierName} (${nId})`);
  }
  return nId;
}
