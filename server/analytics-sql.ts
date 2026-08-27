const forbiddenPatterns: Array<[RegExp, string]> = [
  [/;\s*\S/, "Múltiplas instruções não são permitidas."],
  [/\b(insert|update|delete|drop|alter|truncate|create|replace|merge)\b/i, "Comandos de modificação de dados ou esquema não são permitidos."],
  [/\b(grant|revoke|call|execute|exec|set|use|lock|unlock)\b/i, "Comandos administrativos não são permitidos."],
  [/\b(load_file|load\s+data|into\s+outfile|sleep|benchmark)\b/i, "Funções ou operações inseguras não são permitidas."],
  [/\b(information_schema|mysql\.|performance_schema|sys\.)\b/i, "Metadados do sistema não podem ser consultados."],
  [/(--|\/\*|\*\/|#)/, "Comentários SQL não são permitidos."],
];

export type QueryValidation =
  | { allowed: true; statement: string }
  | { allowed: false; reason: string };

/**
 * Guards candidate analytical SQL before it can reach a query executor.
 * This guard is intentionally strict: only a single SELECT or CTE statement is accepted.
 */
export function validateReadOnlySql(candidate: string): QueryValidation {
  const statement = candidate.trim();

  if (!statement) return { allowed: false, reason: "A consulta não pode estar vazia." };
  if (statement.length > 10_000) return { allowed: false, reason: "A consulta excede o limite permitido." };

  for (const [pattern, reason] of forbiddenPatterns) {
    if (pattern.test(statement)) return { allowed: false, reason };
  }

  const normalized = statement.replace(/\s+/g, " ").trim();
  if (!/^(select|with)\b/i.test(normalized)) {
    return { allowed: false, reason: "Somente consultas SELECT ou CTEs de leitura são permitidas." };
  }

  return { allowed: true, statement: normalized.replace(/;$/, "") };
}

export const approvedMetrics = ["revenue", "sales", "customers", "forecast", "pipeline", "retention"] as const;
export type ApprovedMetric = (typeof approvedMetrics)[number];

/**
 * The first production query path works from an allow-list of semantic metrics.
 * The organization id is always supplied by the server-side membership lookup, never from the client.
 */
export function buildMetricQuery(metric: ApprovedMetric, organizationId: number) {
  const statements: Record<ApprovedMetric, string> = {
    revenue: "SELECT metric_date, total_revenue FROM executive_metric_snapshots WHERE organizationId = ? ORDER BY metric_date DESC LIMIT 24",
    sales: "SELECT metric_date, sales_count, average_ticket FROM executive_metric_snapshots WHERE organizationId = ? ORDER BY metric_date DESC LIMIT 24",
    customers: "SELECT metric_date, active_customers, retained_customers FROM executive_metric_snapshots WHERE organizationId = ? ORDER BY metric_date DESC LIMIT 24",
    forecast: "SELECT metric_date, forecast_revenue, confidence FROM executive_metric_snapshots WHERE organizationId = ? ORDER BY metric_date DESC LIMIT 12",
    pipeline: "SELECT metric_date, pipeline_value, conversion_rate FROM executive_metric_snapshots WHERE organizationId = ? ORDER BY metric_date DESC LIMIT 12",
    retention: "SELECT metric_date, retention_rate, churn_risk_count FROM executive_metric_snapshots WHERE organizationId = ? ORDER BY metric_date DESC LIMIT 12",
  };

  return { statement: statements[metric], params: [organizationId] };
}
