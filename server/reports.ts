import { and, desc, eq } from "drizzle-orm";
import { reportArtifacts, reports } from "../drizzle/schema";
import { getDb } from "./db";
import { storagePut } from "./storage";
import { buildReportPreview } from "./report-scheduler";

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

export async function getReportForOrganization(reportId: number, organizationId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(reports).where(and(eq(reports.id, reportId), eq(reports.organizationId, organizationId))).limit(1);
  return rows[0];
}

export async function getReportByScheduleTaskUid(taskUid: string) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(reports).where(eq(reports.scheduleCronTaskUid, taskUid)).limit(1);
  return rows[0];
}

export async function persistReportSchedule(reportId: number, organizationId: number, taskUid: string) {
  const db = await getDb();
  if (!db) throw new Error("A base de dados não está disponível para guardar o agendamento.");
  await db.update(reports).set({ scheduleCronTaskUid: taskUid }).where(and(eq(reports.id, reportId), eq(reports.organizationId, organizationId)));
}

export async function setReportScheduleActive(reportId: number, organizationId: number, isActive: boolean) {
  const db = await getDb();
  if (!db) throw new Error("A base de dados não está disponível para actualizar o agendamento.");
  await db.update(reports).set({ isActive: isActive ? 1 : 0 }).where(and(eq(reports.id, reportId), eq(reports.organizationId, organizationId)));
}

export async function markReportGenerated(reportId: number) {
  const db = await getDb();
  if (!db) throw new Error("A base de dados não está disponível para atualizar o relatório.");
  await db.update(reports).set({ lastGeneratedAt: new Date() }).where(eq(reports.id, reportId));
}

export async function generateReportArtifact(report: NonNullable<Awaited<ReturnType<typeof getReportForOrganization>>>, organizationName: string) {
  const db = await getDb();
  if (!db) throw new Error("A base de dados não está disponível para gerar o relatório.");
  const generatedAt = new Date();
  const content = buildReportPreview({ name: report.name, category: report.category, cadence: report.cadence, organizationName, generatedAt });
  const stored = await storagePut(`organizations/${report.organizationId}/reports/${report.id}-${generatedAt.toISOString().slice(0, 10)}.md`, content, "text/markdown; charset=utf-8");
  const title = `${report.name} · ${generatedAt.toLocaleDateString("pt-AO")}`;
  const [created] = await db.insert(reportArtifacts).values({ organizationId: report.organizationId, reportId: report.id, fileKey: stored.key, title }).$returningId();
  await markReportGenerated(report.id);
  return { id: created?.id, title, url: stored.url, generatedAt };
}

export async function listReportArtifacts(reportId: number, organizationId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(reportArtifacts).where(and(eq(reportArtifacts.reportId, reportId), eq(reportArtifacts.organizationId, organizationId))).orderBy(desc(reportArtifacts.createdAt)).limit(10);
}
