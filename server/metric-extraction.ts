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

export type BusinessFieldMapping = Partial<Record<"date" | "revenue" | "sales" | "customer" | "product" | "order", string>>;
export type ExtractedProductMetric = { productName: string; totalRevenue: number; salesCount: number };

const synonyms = {
  date: ["data", "date", "data venda", "sale date", "periodo", "período", "mes", "mês"],
  revenue: ["receita", "faturamento", "valor", "valor venda", "revenue", "amount", "total"],
  sales: ["quantidade", "qtd", "unidades", "itens", "sales count"],
  order: ["pedido", "order", "documento", "id pedido", "número pedido"],
  legacySale: ["venda", "sale", "pedido", "order", "quantidade", "qtd"],
  customer: ["cliente", "customer", "conta", "account", "cliente id", "customer id"],
  product: ["produto", "product", "artigo", "item", "serviço", "servico"],
} as const;

function normalize(value: string) { return value.toLocaleLowerCase("pt-BR").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim(); }
function columnFor(row: DatasetRow, candidates: readonly string[]) { const keys = Object.keys(row); return keys.find((key) => candidates.some((candidate) => normalize(key) === normalize(candidate))) ?? keys.find((key) => candidates.some((candidate) => normalize(key).includes(normalize(candidate)))); }
function toNumber(value: unknown) { if (typeof value === "number") return Number.isFinite(value) ? value : 0; if (typeof value !== "string") return 0; const parsed = Number(value.replace(/[^0-9,.-]/g, "").replace(/\.(?=\d{3}(?:\D|$))/g, "").replace(",", ".")); return Number.isFinite(parsed) ? parsed : 0; }
function monthKey(value: unknown) { const parsed = value instanceof Date ? value : new Date(String(value)); return Number.isNaN(parsed.getTime()) ? new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1)) : new Date(Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), 1)); }

function resolvedKeys(sample: DatasetRow, mapping?: BusinessFieldMapping) {
  return {
    revenueKey: mapping?.revenue ?? columnFor(sample, synonyms.revenue),
    salesKey: mapping ? mapping.sales : columnFor(sample, synonyms.sales),
    orderKey: mapping?.order,
    legacySalesKey: mapping ? undefined : columnFor(sample, synonyms.legacySale),
    customerKey: mapping?.customer ?? columnFor(sample, synonyms.customer),
    dateKey: mapping?.date ?? columnFor(sample, synonyms.date),
    productKey: mapping?.product ?? columnFor(sample, synonyms.product),
  };
}

function addSales(bucket: { sales: number; orders: Set<string> }, row: DatasetRow, keys: ReturnType<typeof resolvedKeys>) {
  if (keys.salesKey) bucket.sales += Math.max(0, Math.round(toNumber(row[keys.salesKey])));
  else if (keys.orderKey && row[keys.orderKey] !== undefined && row[keys.orderKey] !== null && String(row[keys.orderKey]).trim()) bucket.orders.add(String(row[keys.orderKey]).trim());
  else if (keys.legacySalesKey) bucket.sales += Math.max(0, Math.round(toNumber(row[keys.legacySalesKey])));
  else if (keys.revenueKey) bucket.sales += 1;
}

/** Derives aggregate snapshots from recognised columns or a user-confirmed field mapping. */
export function extractMetricSnapshots(rows: DatasetRow[], mapping?: BusinessFieldMapping): ExtractedMetricSnapshot[] {
  const sample = rows.find((row) => Object.keys(row).length > 0);
  if (!sample) return [];
  const keys = resolvedKeys(sample, mapping);
  if (!keys.revenueKey && !keys.salesKey && !keys.orderKey && !keys.legacySalesKey && !keys.customerKey) return [];
  const buckets = new Map<string, { date: Date; revenue: number; sales: number; orders: Set<string>; customers: Set<string> }>();
  for (const row of rows) {
    const date = monthKey(keys.dateKey ? row[keys.dateKey] : undefined);
    const key = date.toISOString();
    const bucket = buckets.get(key) ?? { date, revenue: 0, sales: 0, orders: new Set<string>(), customers: new Set<string>() };
    bucket.revenue += keys.revenueKey ? toNumber(row[keys.revenueKey]) : 0;
    addSales(bucket, row, keys);
    if (keys.customerKey && row[keys.customerKey] !== undefined && row[keys.customerKey] !== null && String(row[keys.customerKey]).trim()) bucket.customers.add(String(row[keys.customerKey]).trim());
    buckets.set(key, bucket);
  }
  const ordered = Array.from(buckets.values()).sort((left, right) => left.date.getTime() - right.date.getTime());
  return ordered.map((bucket, index) => {
    const previous = ordered[index - 1];
    const retainedCustomers = previous ? Array.from(bucket.customers).filter((customer) => previous.customers.has(customer)).length : 0;
    const salesCount = bucket.sales || bucket.orders.size;
    const previousRevenue = previous?.revenue ?? bucket.revenue;
    return { metricDate: bucket.date, totalRevenue: Math.round(bucket.revenue), salesCount, averageTicket: salesCount ? Math.round(bucket.revenue / salesCount) : 0, activeCustomers: bucket.customers.size, retainedCustomers, forecastRevenue: index ? Math.max(0, Math.round(bucket.revenue + (bucket.revenue - previousRevenue))) : Math.round(bucket.revenue), confidence: index ? 65 : 50, pipelineValue: 0, conversionRate: 0, retentionRate: bucket.customers.size ? Math.round((retainedCustomers / bucket.customers.size) * 100) : 0, churnRiskCount: previous ? Math.max(0, previous.customers.size - retainedCustomers) : 0 };
  });
}

/** Produces product-level aggregates only from a recognised or user-confirmed product column. */
export function extractProductMetrics(rows: DatasetRow[], mapping?: BusinessFieldMapping): ExtractedProductMetric[] {
  const sample = rows.find((row) => Object.keys(row).length > 0);
  if (!sample) return [];
  const keys = resolvedKeys(sample, mapping);
  if (!keys.productKey) return [];
  const products = new Map<string, { revenue: number; sales: number; orders: Set<string> }>();
  for (const row of rows) {
    const value = row[keys.productKey];
    const productName = value === undefined || value === null ? "" : String(value).trim().slice(0, 255);
    if (!productName) continue;
    const bucket = products.get(productName) ?? { revenue: 0, sales: 0, orders: new Set<string>() };
    bucket.revenue += keys.revenueKey ? toNumber(row[keys.revenueKey]) : 0;
    addSales(bucket, row, keys);
    products.set(productName, bucket);
  }
  return Array.from(products.entries()).map(([productName, bucket]) => ({ productName, totalRevenue: Math.round(bucket.revenue), salesCount: bucket.sales || bucket.orders.size })).sort((left, right) => right.totalRevenue - left.totalRevenue);
}
