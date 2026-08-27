import { desc, eq } from "drizzle-orm";
import { executiveMetricSnapshots } from "../drizzle/schema";
import { type ApprovedMetric } from "./analytics-sql";
import { getDb } from "./db";
import { enforceTenantScope } from "./tenant-scope";

export type AnalyticalMetricPoint = {
  date: Date;
  value: number;
  secondaryValue?: number;
};

export type AnalyticalReadResult = {
  state: "ready" | "empty" | "unavailable" | "failed";
  points: AnalyticalMetricPoint[];
  message?: string;
};

type ExecutiveMetricRow = typeof executiveMetricSnapshots.$inferSelect;

export function projectMetricRows(metric: ApprovedMetric, organizationId: number, rows: ExecutiveMetricRow[]): AnalyticalMetricPoint[] {
  return rows.map((row) => {
    const scoped = enforceTenantScope(row, organizationId);
    if (!scoped) throw new Error("Métrica não encontrada.");
    const date = scoped.metricDate;
    switch (metric) {
      case "revenue": return { date, value: scoped.totalRevenue };
      case "sales": return { date, value: scoped.salesCount, secondaryValue: scoped.averageTicket };
      case "customers": return { date, value: scoped.activeCustomers, secondaryValue: scoped.retainedCustomers };
      case "forecast": return { date, value: scoped.forecastRevenue, secondaryValue: scoped.confidence };
      case "pipeline": return { date, value: scoped.pipelineValue, secondaryValue: scoped.conversionRate };
      case "retention": return { date, value: scoped.retentionRate, secondaryValue: scoped.churnRiskCount };
    }
  });
}

/**
 * Executes only compiled, typed reads. The organization scope is a server-resolved id.
 * No user-provided SQL ever reaches this function.
 */
export async function readApprovedMetric(metric: ApprovedMetric, organizationId: number): Promise<AnalyticalReadResult> {
  const db = await getDb();
  if (!db) return { state: "unavailable", points: [], message: "A conexão analítica ainda não está disponível." };

  try {
    const rows = await db
      .select()
      .from(executiveMetricSnapshots)
      .where(eq(executiveMetricSnapshots.organizationId, organizationId))
      .orderBy(desc(executiveMetricSnapshots.metricDate))
      .limit(metric === "forecast" || metric === "pipeline" || metric === "retention" ? 12 : 24);
    const points = projectMetricRows(metric, organizationId, rows);
    return points.length ? { state: "ready", points } : { state: "empty", points: [], message: "Não existem métricas para o período solicitado." };
  } catch (error) {
    console.error("[Analytics] Approved metric read failed", { metric, organizationId, error });
    return { state: "failed", points: [], message: "Não foi possível consultar esta métrica agora." };
  }
}
