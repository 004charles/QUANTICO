import { and, desc, eq, gte } from "drizzle-orm";
import { alertEvents, alertRules } from "../drizzle/schema";
import { readApprovedMetric, type AnalyticalMetricPoint } from "./analytics-read-model";
import { detectLatestMetricAnomaly } from "./anomaly-detection";
import { getDb } from "./db";

export const alertTypes = ["revenue_anomaly", "sales_goal", "customer_risk"] as const;
export type AlertType = (typeof alertTypes)[number];
export type AlertEvaluation = { currentValue: number; severity: "medium" | "high"; title: string; message: string } | null;
type AlertRuleInput = { alertType: string; threshold: number };

export async function listAlertRules(organizationId: number) { const db = await getDb(); return db ? db.select().from(alertRules).where(eq(alertRules.organizationId, organizationId)).orderBy(desc(alertRules.updatedAt)).limit(100) : []; }
export async function createAlertRule(input: { organizationId: number; createdByUserId: number; name: string; alertType: AlertType; threshold: number }) { const db = await getDb(); if (!db) throw new Error("A base de dados não está disponível para criar o alerta."); const [created] = await db.insert(alertRules).values({ ...input, name: input.name.trim(), threshold: Math.max(0, Math.min(100_000_000, Math.round(input.threshold))), isActive: 1 }).$returningId(); return { id: created?.id, ...input, isActive: true }; }
export async function setAlertRuleActive(input: { organizationId: number; ruleId: number; isActive: boolean }) { const db = await getDb(); if (!db) throw new Error("A base de dados não está disponível para actualizar o alerta."); const result = await db.update(alertRules).set({ isActive: input.isActive ? 1 : 0 }).where(and(eq(alertRules.id, input.ruleId), eq(alertRules.organizationId, input.organizationId))); if (!result[0].affectedRows) throw new Error("Alerta não encontrado nesta organização."); return { ruleId: input.ruleId, isActive: input.isActive }; }
export async function listAlertEvents(organizationId: number) { const db = await getDb(); return db ? db.select().from(alertEvents).where(eq(alertEvents.organizationId, organizationId)).orderBy(desc(alertEvents.createdAt)).limit(50) : []; }

/** Applies alert thresholds to pre-authorized, aggregate series only. */
export function evaluateAlertCondition(rule: AlertRuleInput, metrics: { revenue: AnalyticalMetricPoint[]; sales: AnalyticalMetricPoint[]; retention: AnalyticalMetricPoint[] }): AlertEvaluation {
  if (rule.alertType === "revenue_anomaly") { const anomaly = detectLatestMetricAnomaly(metrics.revenue); if (!anomaly || Math.abs(anomaly.deviationPercent) < rule.threshold) return null; return { currentValue: anomaly.value, severity: anomaly.severity, title: "Variação relevante de receita", message: `A receita variou ${anomaly.deviationPercent}% em relação à linha de base de ${anomaly.baseline.toLocaleString("pt-AO")} Kz.` }; }
  if (rule.alertType === "sales_goal") { const latest = metrics.sales.at(0); if (!latest || latest.value >= rule.threshold) return null; return { currentValue: latest.value, severity: "medium", title: "Meta de vendas abaixo do limiar", message: `O último período registou ${latest.value.toLocaleString("pt-AO")} vendas, abaixo do limiar de ${rule.threshold.toLocaleString("pt-AO")}.` }; }
  if (rule.alertType === "customer_risk") { const latest = metrics.retention.at(0); const risk = latest?.secondaryValue ?? 0; if (!latest || risk < rule.threshold) return null; return { currentValue: risk, severity: risk >= rule.threshold * 2 ? "high" : "medium", title: "Clientes em risco requerem atenção", message: `${risk.toLocaleString("pt-AO")} cliente(s) em risco foram identificados no último período disponível.` }; }
  return null;
}

function startOfUtcDay() { const date = new Date(); return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())); }
async function evaluateRule(rule: typeof alertRules.$inferSelect, organizationId: number) {
  const [revenue, sales, retention] = await Promise.all([readApprovedMetric("revenue", organizationId), readApprovedMetric("sales", organizationId), readApprovedMetric("retention", organizationId)]);
  return evaluateAlertCondition(rule, { revenue: revenue.points, sales: sales.points, retention: retention.points });
}

/** Evaluates active rules against aggregate metrics and creates at most one event per rule per UTC day. */
export async function evaluateAlertRules(organizationId: number) {
  const db = await getDb(); if (!db) throw new Error("A base de dados não está disponível para avaliar alertas.");
  const rules = await db.select().from(alertRules).where(and(eq(alertRules.organizationId, organizationId), eq(alertRules.isActive, 1)));
  const created = [] as Array<{ ruleId: number; title: string }>;
  for (const rule of rules) {
    const event = await evaluateRule(rule, organizationId); if (!event) continue;
    const existing = (await db.select({ id: alertEvents.id }).from(alertEvents).where(and(eq(alertEvents.organizationId, organizationId), eq(alertEvents.alertRuleId, rule.id), gte(alertEvents.createdAt, startOfUtcDay()))).limit(1))[0];
    if (existing) continue;
    await db.insert(alertEvents).values({ organizationId, alertRuleId: rule.id, alertType: rule.alertType, title: event.title, message: event.message, currentValue: event.currentValue, threshold: rule.threshold, severity: event.severity });
    await db.update(alertRules).set({ lastTriggeredAt: new Date() }).where(and(eq(alertRules.id, rule.id), eq(alertRules.organizationId, organizationId)));
    created.push({ ruleId: rule.id, title: event.title });
  }
  return { evaluated: rules.length, created };
}
