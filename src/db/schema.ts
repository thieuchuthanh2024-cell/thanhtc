import { pgTable, text, integer, doublePrecision, boolean, timestamp, index } from "drizzle-orm/pg-core";

// Table to store Mobile Networks (Nhà mạng)
export const networks = pgTable("networks", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  logo: text("logo"), // Hex color representation or style description for custom brand styling
  notes: text("notes"),
});

// Table to store Gói Cước (Mobile Packages)
export const packages = pgTable("packages", {
  id: text("id").primaryKey(),
  networkId: text("network_id").notNull().references(() => networks.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  monthlyFee: doublePrecision("monthly_fee").notNull(),
  minutesInternal: integer("minutes_internal").default(0).notNull(),
  minutesExternal: integer("minutes_external").default(0).notNull(),
  smsInternal: integer("sms_internal").default(0).notNull(),
  smsExternal: integer("sms_external").default(0).notNull(),
  dataGb: doublePrecision("data_gb").default(0).notNull(),
  dataLimitText: text("data_limit_text"), // e.g. "4GB/Ngày" or "120GB/Tháng"
  outOfBundleCharge: text("out_of_bundle_charge"), // Price/limit out of bundle description
  isMandatory: boolean("is_mandatory").default(false).notNull(), // Mandatory committed package (không được bỏ chọn)
}, (table) => {
  return [
    index("packages_network_id_idx").on(table.networkId),
  ];
});

// Table to store SIM cards
export const sims = pgTable("sims", {
  id: text("id").primaryKey(),
  number: text("number").notNull(),
  searchableNumber: text("searchable_number").notNull(),
  carrier: text("carrier").notNull(), // Left for backward compatibility and string queries
  networkId: text("network_id").references(() => networks.id, { onDelete: "set null" }), // Associated network table
  mandatoryPackageId: text("mandatory_package_id"), // NULL if normal sim with optional selections, or package_id for custom committed packages
  price: doublePrecision("price").notNull(),
  category: text("category").notNull(),
  status: text("status").notNull(),
  sum: integer("sum").notNull(),
  isHot: boolean("is_hot").default(false),
  notes: text("notes"),
  syncSource: text("sync_source"),
  syncUser: text("sync_user"),
  lastSyncedAt: text("last_synced_at"),
}, (table) => {
  return [
    index("searchable_number_idx").on(table.searchableNumber),
    index("carrier_idx").on(table.carrier),
    index("category_idx").on(table.category),
    index("price_idx").on(table.price),
    index("sims_status_idx").on(table.status),
    index("sims_network_id_idx").on(table.networkId),
    index("sims_mandatory_package_id_idx").on(table.mandatoryPackageId),
  ];
});

// Table to store deleted SIMs
export const deletedSims = pgTable("deleted_sims", {
  id: text("id").primaryKey(),
  number: text("number").notNull(),
  carrier: text("carrier").notNull(),
  price: doublePrecision("price").notNull(),
  category: text("category").notNull(),
  sum: integer("sum").notNull(),
  deletedAt: text("deleted_at").notNull(),
  reason: text("reason").notNull(),
  syncSource: text("sync_source"),
  syncUser: text("sync_user"),
});

// Table to store Agent Profiles
export const agents = pgTable("agents", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  role: text("role").notNull(),
  discountRate: doublePrecision("discount_rate").notNull(),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  commissionEarned: doublePrecision("commission_earned").default(0).notNull(),
  totalSales: doublePrecision("total_sales").default(0).notNull(),
  password: text("password"),
  uid: text("uid"), // Optional Firebase UID for future firebase auth integrations
});

// Table to store Orders
export const orders = pgTable("orders", {
  id: text("id").primaryKey(),
  simId: text("sim_id").notNull(),
  simNumber: text("sim_number").notNull(),
  carrier: text("carrier").notNull(),
  price: doublePrecision("price").notNull(),
  discountPrice: doublePrecision("discount_price").notNull(),
  agentId: text("agent_id"),
  agentRole: text("agent_role"),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone").notNull(),
  customerAddress: text("customer_address"),
  paymentMethod: text("payment_method").notNull(),
  paymentStatus: text("payment_status").notNull(),
  status: text("status").notNull(),
  createdAt: text("created_at").notNull(), // Storing as ISO String for consistency
  
  // Package additions (Chi tiết gói cước đi kèm)
  packageId: text("package_id"),
  packageName: text("package_name"),
  packageFee: doublePrecision("package_fee"),
  packageDetails: text("package_details"),
  isPackageMandatory: boolean("is_package_mandatory").default(false),
}, (table) => {
  return [
    index("orders_sim_id_idx").on(table.simId),
    index("orders_agent_id_idx").on(table.agentId),
    index("orders_created_at_idx").on(table.createdAt),
  ];
});

// Table to store System Configurations & Secrets (for On-Prem stateless deployment)
export const systemConfigs = pgTable("system_configs", {
  key: text("key").primaryKey(),
  value: text("value").notNull(), // JSON string representing the config object
});
