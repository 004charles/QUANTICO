import type { AnalyticalMetricPoint } from "../analytics-read-model";

export type AiVisualization = {
  type: "bar" | "line" | "table";
  title: string;
  seriesLabel: string;
  data: Array<{ label: string; value: number }>;
};

export type PeriodComparison = {
  currentLabel: string;
  previousLabel: string;
  currentValue: number;
  previousValue: number;
  variationPercent: number | null;
};

function pointLabel(date: Date) {
  return new Intl.DateTimeFormat("pt-AO", { month: "short", year: "numeric" }).format(date);
}

/** Builds deterministic context from approved metric points; it never asks the model to fabricate series. */
export function buildAnalyticalEnhancements(points: AnalyticalMetricPoint[]): { visualization?: AiVisualization; comparison?: PeriodComparison } {
  if (!points.length) return {};
  const chronological = [...points].sort((a, b) => a.date.getTime() - b.date.getTime());
  const latest = chronological.at(-1)!;
  const previous = chronological.at(-2);
  const visualization: AiVisualization = {
    type: "line",
    title: "Receita no período disponível",
    seriesLabel: "Receita",
    data: chronological.slice(-8).map((point) => ({ label: pointLabel(point.date), value: point.value })),
  };
  if (!previous) return { visualization };
  const variationPercent = previous.value === 0 ? null : Number((((latest.value - previous.value) / previous.value) * 100).toFixed(1));
  return {
    visualization,
    comparison: { currentLabel: pointLabel(latest.date), previousLabel: pointLabel(previous.date), currentValue: latest.value, previousValue: previous.value, variationPercent },
  };
}
