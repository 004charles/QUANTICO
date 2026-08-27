import { desc, eq } from "drizzle-orm";
import { reports } from "../drizzle/schema";
import { getDb } from "./db";

export type ReportCategory = "executive" | "financial" | "commercial";
export type ReportCadence = "daily" | "weekly" | "monthly" | "manual";

export async function listReports(organizationId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(reports).where(eq(reports.organizationId, organizationId)).orderBy(desc(reports.createdAt)).limit(50);
}

export async function createReport(input: { organizationId: number; name: string; category: ReportCategory; cadence: ReportCadence }) {
  const db = await getDb();
  if (!db) throw new Error("A base de dados não está disponível para criar o relatório.");
  const [created] = await db.insert(reports).values({ organizationId: input.organizationId, name: input.name, category: input.category, cadence: input.cadence, configuration: { version: 1 }, isActive: 1 }).$returningId();
  return { id: created?.id, ...input };
}
