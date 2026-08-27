import type { AnalyticalMetricPoint } from "./analytics-read-model";

export type MetricAnomaly = {
  date: Date;
  value: number;
  baseline: number;
  deviationPercent: number;
  severity: "medium" | "high";
};

/** Detects a material latest-period deviation using only the tenant-scoped metric series supplied. */
export function detectLatestMetricAnomaly(points: AnalyticalMetricPoint[]): MetricAnomaly | null {
  if (points.length < 4) return null;
  const chronological = [...points].sort((a, b) => a.date.getTime() - b.date.getTime());
  const latest = chronological.at(-1)!;
  const baselinePoints = chronological.slice(0, -1).map((point) => point.value);
  const baseline = baselinePoints.reduce((sum, value) => sum + value, 0) / baselinePoints.length;
  if (baseline === 0) return null;
  const variance = baselinePoints.reduce((sum, value) => sum + (value - baseline) ** 2, 0) / baselinePoints.length;
  const standardDeviation = Math.sqrt(variance);
  const deviationPercent = Number((((latest.value - baseline) / baseline) * 100).toFixed(1));
  const zScore = standardDeviation === 0 ? Math.abs(deviationPercent) / 10 : Math.abs(latest.value - baseline) / standardDeviation;
  if (zScore < 2 || Math.abs(deviationPercent) < 15) return null;
  return { date: latest.date, value: latest.value, baseline: Math.round(baseline), deviationPercent, severity: Math.abs(deviationPercent) >= 30 ? "high" : "medium" };
}
