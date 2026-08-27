import type { DatasetRow } from "./data-profiler";

export type ExtractedMetricSnapshot = {
  metricDate: Date;
  totalRevenue: number;
  salesCount: number;
  averageTicket: number;
  activeCustomers: number;
  retainedCustomers: number;
  forecastRevenue: number;
  confidence: number;
  pipelineValue: number;
  conversionRate: number;
  retentionRate: number;
  churnRiskCount: number;
};

const synonyms = {
  date: ["data", "date", "data venda", "sale date", "periodo", "período", "mes", "mês"],
  revenue: ["receita", "faturamento", "valor", "valor venda", "revenue", "amount", "total"],
  sale: ["venda", "sale", "pedido", "order", "quantidade", "qtd"],
  customer: ["cliente", "customer", "conta", "account", "cliente id", "customer id"],
} as const;

function normalize(value: string) { return value.toLocaleLowerCase("pt-BR").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim(); }
function columnFor(row: DatasetRow, candidates: readonly string[]) {
  const keys = Object.keys(row);
  return keys.find((key) => candidates.some((candidate) => normalize(key) === normalize(candidate)))
    ?? keys.find((key) => candidates.some((candidate) => normalize(key).includes(normalize(candidate))));
}
function toNumber(value: unknown) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value !== "string") return 0;
  const sanitized = value.replace(/[^0-9,.-]/g, "").replace(/\.(?=\d{3}(?:\D|$))/g, "").replace(",", ".");
  const parsed = Number(sanitized);
  return Number.isFinite(parsed) ? parsed : 0;
}
function monthKey(value: unknown) {
  const parsed = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(parsed.getTime())) return new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1));
  return new Date(Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), 1));
}

/** Derives aggregate snapshots solely from recognized imported columns; unrecognized fields are ignored. */
export function extractMetricSnapshots(rows: DatasetRow[]): ExtractedMetricSnapshot[] {
  if (!rows.length) return [];
  const sample = rows.find((row) => Object.keys(row).length > 0);
  if (!sample) return [];
  const revenueKey = columnFor(sample, synonyms.revenue);
  const saleKey = columnFor(sample, synonyms.sale);
  const customerKey = columnFor(sample, synonyms.customer);
  const dateKey = columnFor(sample, synonyms.date);
  if (!revenueKey && !saleKey && !customerKey) return [];
  const buckets = new Map<string, { date: Date; revenue: number; sales: number; customers: Set<string> }>();
  for (const row of rows) {
    const date = monthKey(dateKey ? row[dateKey] : undefined);
    const key = date.toISOString();
    const bucket = buckets.get(key) ?? { date, revenue: 0, sales: 0, customers: new Set<string>() };
    bucket.revenue += revenueKey ? toNumber(row[revenueKey]) : 0;
    bucket.sales += saleKey ? Math.max(0, Math.round(toNumber(row[saleKey]))) : revenueKey ? 1 : 0;
    if (customerKey && row[customerKey] !== undefined && row[customerKey] !== null && String(row[customerKey]).trim()) bucket.customers.add(String(row[customerKey]).trim());
    buckets.set(key, bucket);
  }
  const ordered = Array.from(buckets.values()).sort((left, right) => left.date.getTime() - right.date.getTime());
  return ordered.map((bucket, index) => {
    const previous = ordered[index - 1];
    const retainedCustomers = previous ? Array.from(bucket.customers).filter((customer) => previous.customers.has(customer)).length : 0;
    const previousRevenue = previous?.revenue ?? bucket.revenue;
    const forecastRevenue = index ? Math.max(0, Math.round(bucket.revenue + (bucket.revenue - previousRevenue))) : Math.round(bucket.revenue);
    const activeCustomers = bucket.customers.size;
    return {
      metricDate: bucket.date,
      totalRevenue: Math.round(bucket.revenue),
      salesCount: bucket.sales,
      averageTicket: bucket.sales ? Math.round(bucket.revenue / bucket.sales) : 0,
      activeCustomers,
      retainedCustomers,
      forecastRevenue,
      confidence: index ? 65 : 50,
      pipelineValue: 0,
      conversionRate: 0,
      retentionRate: activeCustomers ? Math.round((retainedCustomers / activeCustomers) * 100) : 0,
      churnRiskCount: previous ? Math.max(0, previous.customers.size - retainedCustomers) : 0,
    };
  });
}
