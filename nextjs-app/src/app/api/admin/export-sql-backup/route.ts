import { NextResponse } from "next/server";
import { db } from "@/db";
import { sims, agents, orders } from "@/db/schema";
import { sql } from "drizzle-orm";

export async function GET() {
  try {
    const allSims = await db.select().from(sims).limit(5000);
    const allSimsCountRes = await db.select({ count: sql<number>`count(*)` }).from(sims);
    const totalSimsCount = Number(allSimsCountRes[0]?.count || 0);

    const allAgents = await db.select().from(agents);
    const allOrders = await db.select().from(orders);

    let sqlText = `-- =========================================================\n`;
    sqlText += `-- VIETSIM ENTERPRISE AUTONOMOUS POSTGRESQL BACKUP DUMP\n`;
    sqlText += `-- Generated at: ${new Date().toISOString()}\n`;
    sqlText += `-- Cloud Run Active Service Database Instance\n`;
    sqlText += `-- Total SIMs in database: ${totalSimsCount}\n`;
    if (totalSimsCount > 5000) {
      sqlText += `-- WARNING: Due to large-scale dataset size (${totalSimsCount} SIMs),\n`;
      sqlText += `-- this HTTP-based file export only includes a sample of 5,000 SIM records\n`;
      sqlText += `-- to prevent Cloud Run Container out-of-memory crashes. Please utilize the\n`;
      sqlText += `-- Google Cloud SQL Console dashboard for full database.sql backup dumps!\n`;
    }
    sqlText += `-- =========================================================\n\n`;

    sqlText += `-- ---------------------------------------------------------\n`;
    sqlText += `-- Structure & Data for Table: sims (Capped Sample)\n`;
    sqlText += `-- ---------------------------------------------------------\n`;
    sqlText += `CREATE TABLE IF NOT EXISTS sims (\n  id TEXT PRIMARY KEY,\n  number TEXT NOT NULL,\n  searchable_number TEXT NOT NULL,\n  carrier TEXT NOT NULL,\n  price DOUBLE PRECISION NOT NULL,\n  category TEXT NOT NULL,\n  status TEXT NOT NULL,\n  sum INTEGER NOT NULL,\n  is_hot BOOLEAN DEFAULT false,\n  notes TEXT\n);\n\n`;

    for (const sim of allSims) {
      const activeId = sim.id.replace(/'/g, "''");
      const number = sim.number.replace(/'/g, "''");
      const searchableNumber = sim.searchableNumber.replace(/'/g, "''");
      const carrier = sim.carrier.replace(/'/g, "''");
      const category = sim.category.replace(/'/g, "''");
      const status = sim.status.replace(/'/g, "''");
      const isHot = sim.isHot ? "true" : "false";
      const notes = sim.notes ? `'${sim.notes.replace(/'/g, "''")}'` : "NULL";

      sqlText += `INSERT INTO sims (id, number, searchable_number, carrier, price, category, status, sum, is_hot, notes) VALUES ('${activeId}', '${number}', '${searchableNumber}', '${carrier}', ${sim.price}, '${category}', '${status}', ${sim.sum}, ${isHot}, ${notes}) ON CONFLICT (id) DO UPDATE SET status = EXCLUSION.status;\n`;
    }

    sqlText += `\n-- ---------------------------------------------------------\n`;
    sqlText += `-- Structure & Data for Table: agents\n`;
    sqlText += `-- ---------------------------------------------------------\n`;
    sqlText += `CREATE TABLE IF NOT EXISTS agents (\n  id TEXT PRIMARY KEY,\n  name TEXT NOT NULL,\n  role TEXT NOT NULL,\n  discount_rate DOUBLE PRECISION NOT NULL,\n  phone TEXT NOT NULL,\n  email TEXT NOT NULL,\n  commission_earned DOUBLE PRECISION DEFAULT 0 NOT NULL,\n  total_sales DOUBLE PRECISION DEFAULT 0 NOT NULL,\n  password TEXT,\n  uid TEXT\n);\n\n`;

    for (const agent of allAgents) {
      const id = agent.id.replace(/'/g, "''");
      const name = agent.name.replace(/'/g, "''");
      const role = agent.role.replace(/'/g, "''");
      const phone = agent.phone.replace(/'/g, "''");
      const email = agent.email.replace(/'/g, "''");
      const password = agent.password ? `'${agent.password.replace(/'/g, "''")}'` : "NULL";
      const uid = agent.uid ? `'${agent.uid.replace(/'/g, "''")}'` : "NULL";

      sqlText += `INSERT INTO agents (id, name, role, discount_rate, phone, email, commission_earned, total_sales, password, uid) VALUES ('${id}', '${name}', '${role}', ${agent.discountRate}, '${phone}', '${email}', ${agent.commissionEarned}, ${agent.totalSales}, ${password}, ${uid}) ON CONFLICT (id) DO UPDATE SET role = EXCLUSION.role;\n`;
    }

    sqlText += `\n-- ---------------------------------------------------------\n`;
    sqlText += `-- Structure & Data for Table: orders\n`;
    sqlText += `-- ---------------------------------------------------------\n`;
    sqlText += `CREATE TABLE IF NOT EXISTS orders (\n  id TEXT PRIMARY KEY,\n  sim_id TEXT NOT NULL REFERENCES sims(id),\n  sim_number TEXT NOT NULL,\n  carrier TEXT NOT NULL,\n  price DOUBLE PRECISION NOT NULL,\n  discount_price DOUBLE PRECISION NOT NULL,\n  agent_id TEXT,\n  agent_role TEXT,\n  customer_name TEXT NOT NULL,\n  customer_phone TEXT NOT NULL,\n  customer_address TEXT,\n  payment_method TEXT NOT NULL,\n  payment_status TEXT NOT NULL,\n  status TEXT NOT NULL,\n  created_at TEXT NOT NULL\n);\n\n`;

    for (const order of allOrders) {
      const id = order.id.replace(/'/g, "''");
      const simId = order.simId.replace(/'/g, "''");
      const simNumber = order.simNumber.replace(/'/g, "''");
      const carrier = order.carrier.replace(/'/g, "''");
      const agentId = order.agentId ? `'${order.agentId.replace(/'/g, "''")}'` : "NULL";
      const agentRole = order.agentRole ? `'${order.agentRole.replace(/'/g, "''")}'` : "NULL";
      const customerName = order.customerName.replace(/'/g, "''");
      const customerPhone = order.customerPhone.replace(/'/g, "''");
      const customerAddress = order.customerAddress ? `'${order.customerAddress.replace(/'/g, "''")}'` : "NULL";
      const paymentMethod = order.paymentMethod.replace(/'/g, "''");
      const paymentStatus = order.paymentStatus.replace(/'/g, "''");
      const status = order.status.replace(/'/g, "''");
      const createdAt = order.createdAt.replace(/'/g, "''");

      sqlText += `INSERT INTO orders (id, sim_id, sim_number, carrier, price, discount_price, agent_id, agent_role, customer_name, customer_phone, customer_address, payment_method, payment_status, status, created_at) VALUES ('${id}', '${simId}', '${simNumber}', '${carrier}', ${order.price}, ${order.discountPrice}, ${agentId}, ${agentRole}, '${customerName}', '${customerPhone}', ${customerAddress}, '${paymentMethod}', '${paymentStatus}', '${status}', '${createdAt}') ON CONFLICT (id) DO UPDATE SET status = EXCLUSION.status;\n`;
    }

    return new NextResponse(sqlText, {
      headers: {
        "Content-Type": "application/sql",
        "Content-Disposition": "attachment; filename=vietsim_backup.sql"
      }
    });
  } catch (err: any) {
    console.error("GET /api/admin/export-sql-backup error:", err);
    return NextResponse.json({ error: "Lỗi tạo file backup SQL: " + err.message }, { status: 500 });
  }
}
