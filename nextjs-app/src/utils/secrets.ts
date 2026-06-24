import { db } from "@/db";
import { systemConfigs } from "@/db/schema";
import { eq } from "drizzle-orm";
import fs from "fs";
import path from "path";

const DEFAULTS = {
  vietqr_enabled: true,
  vietqr_bank: "MB BANK",
  vietqr_account: "1903.8888.8888",
  vietqr_owner: "CONG TY CỔ PHẦN ĐẠI LÝ SIM VIET NAM",
  momo_enabled: true,
  momo_phone: "0988.888.888",
  momo_owner: "NGUYEN VAN ADMIN",
  vnpay_enabled: true,
  vnpay_terminal_id: "VNPAY001",
  vnpay_secret_key: "SEC_ABC123XYZ",
  api_partner_sync_stock_url: "https://api.partner.telecom/v3/stock/sync",
  api_partner_sync_stock_key: "PARTNER_STOCK_KEY_XYZ_999",
  api_partner_activation_url: "https://api.carrier-connect.net/v2/sim/kit-connect",
  api_partner_activation_key: "CARRIER_JWT_SECRET_8888",
  api_payment_webhook_momo_url: "https://kho-sim.vn/api/webhook/payments/momo",
  api_payment_webhook_vnpay_url: "https://kho-sim.vn/api/webhook/payments/vnpay",
  api_payment_webhook_vietqr_url: "https://kho-sim.vn/api/webhook/payments/vietqr",
  sync_schedule_enabled: true,
  sync_schedule_period: "daily",
  sync_schedule_hour: "02",
  sync_last_run: null,
  sync_scraper_target: "https://simthanglong.vn/sim-gia-re",
  sync_scraper_sim_count: "25",
  api_sync_schedule_enabled: true,
  api_sync_schedule_period: "daily",
  api_sync_schedule_hour: "02",
  api_sync_last_run: null,
  api_sync_last_run_logs: [],
  api_sync_last_run_result: null
};

const SECRETS_FILE_PATH = path.join(process.cwd(), "secrets_config.json");

// In-memory cache for fast reads
let cache: any = null;

export async function readSecrets(): Promise<any> {
  if (cache) return cache;

  try {
    // 1. Try reading from PostgreSQL database
    const dbRes = await db.select().from(systemConfigs).where(eq(systemConfigs.key, "secrets_config")).limit(1);
    if (dbRes.length > 0) {
      try {
        const dbData = JSON.parse(dbRes[0].value);
        cache = { ...DEFAULTS, ...dbData };
        return cache;
      } catch (parseErr) {
        console.error("[Secrets Utility] Error parsing config from DB:", parseErr);
      }
    }

    // 2. Fallback to local secrets_config.json
    if (fs.existsSync(SECRETS_FILE_PATH)) {
      try {
        const fileData = JSON.parse(fs.readFileSync(SECRETS_FILE_PATH, "utf-8"));
        cache = { ...DEFAULTS, ...fileData };
        
        // Migrate to database asynchronously
        db.insert(systemConfigs)
          .values({ key: "secrets_config", value: JSON.stringify(cache) })
          .onConflictDoUpdate({ target: systemConfigs.key, set: { value: JSON.stringify(cache) } })
          .catch(e => console.error("[Secrets Utility] DB sync error:", e));

        return cache;
      } catch (fileErr) {
        console.error("[Secrets Utility] Error reading local backup file:", fileErr);
      }
    }
  } catch (err) {
    console.error("[Secrets Utility] Database connection or query error:", err);
  }

  return DEFAULTS;
}

export async function writeSecrets(data: any): Promise<void> {
  cache = data;

  // 1. Write to local secrets_config.json as backup
  try {
    fs.writeFileSync(SECRETS_FILE_PATH, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("[Secrets Utility] Error writing local file backup:", err);
  }

  // 2. Write to PostgreSQL database
  try {
    await db.insert(systemConfigs)
      .values({ key: "secrets_config", value: JSON.stringify(data) })
      .onConflictDoUpdate({ target: systemConfigs.key, set: { value: JSON.stringify(data) } });
    console.log("[Secrets Utility] Synchronized updated config to database successfully!");
  } catch (err) {
    console.error("[Secrets Utility] Error synchronizing config to DB:", err);
  }
}
