import * as XLSX from "xlsx";

export type InferredDataType = "text" | "number" | "currency" | "date" | "boolean" | "mixed";

export type ProfileColumn = {
  name: string;
  inferredType: InferredDataType;
  missingCount: number;
  completeness: number;
  distinctCount: number;
  invalidDateCount: number;
};

export type DatasetProfile = {
  rowCount: number;
  columnCount: number;
  duplicateRowCount: number;
  missingValueCount: number;
  qualityScore: number;
  suggestedMetrics: string[];
  columns: ProfileColumn[];
};

export type DatasetRow = Record<string, unknown>;

const MAX_PROFILE_ROWS = 25_000;
const supportedMimes = new Set([
  "text/csv",
  "application/json",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
]);

function safeCell(value: unknown) {
  return typeof value === "string" ? value.trim() : value;
}

function isEmpty(value: unknown) {
  return value === null || value === undefined || value === "";
}

function inferType(values: unknown[]): { type: InferredDataType; invalidDateCount: number } {
  const populated = values.filter((value) => !isEmpty(value));
  if (!populated.length) return { type: "text", invalidDateCount: 0 };
  const asText = populated.map((value) => String(value).trim());
  const numberCount = asText.filter((value) => /^-?[\d.,]+$/.test(value.replace(/\s/g, ""))).length;
  const currencyCount = asText.filter((value) => /(?:kz|aoa|usd|eur|\$|€)/i.test(value)).length;
  const booleanCount = asText.filter((value) => /^(true|false|sim|não|nao|yes|no|0|1)$/i.test(value)).length;
  const parsedDates = asText.map((value) => Date.parse(value));
  const dateCount = parsedDates.filter((value) => !Number.isNaN(value)).length;
  const ratio = (count: number) => count / populated.length;
  if (ratio(currencyCount) >= 0.7) return { type: "currency", invalidDateCount: 0 };
  if (ratio(booleanCount) >= 0.9) return { type: "boolean", invalidDateCount: 0 };
  if (ratio(numberCount) >= 0.9) return { type: "number", invalidDateCount: 0 };
  if (ratio(dateCount) >= 0.7) return { type: "date", invalidDateCount: populated.length - dateCount };
  if (numberCount || dateCount || booleanCount) return { type: "mixed", invalidDateCount: 0 };
  return { type: "text", invalidDateCount: 0 };
}

function detectSuggestedMetrics(columns: ProfileColumn[]) {
  const names = columns.map((column) => column.name.toLowerCase());
  const suggested = new Set<string>();
  if (names.some((name) => /(receita|faturamento|valor|revenue|amount|preço|preco)/.test(name))) suggested.add("Receita total e ticket médio");
  if (names.some((name) => /(venda|pedido|order|sale)/.test(name))) suggested.add("Volume de vendas e conversão");
  if (names.some((name) => /(cliente|customer|conta|account)/.test(name))) suggested.add("Clientes ativos, recorrência e retenção");
  if (names.some((name) => /(produto|product|categoria|category)/.test(name))) suggested.add("Performance por produto e margem");
  if (names.some((name) => /(data|date|mês|mes|period)/.test(name))) suggested.add("Tendência temporal e previsão");
  return Array.from(suggested).slice(0, 4);
}

export function profileRows(rows: DatasetRow[]): DatasetProfile {
  const sampled = rows.slice(0, MAX_PROFILE_ROWS);
  const columnNames = Array.from(new Set(sampled.flatMap((row) => Object.keys(row))));
  const columns = columnNames.map((name) => {
    const values = sampled.map((row) => safeCell(row[name]));
    const missingCount = values.filter(isEmpty).length;
    const { type: inferredType, invalidDateCount } = inferType(values);
    const distinctCount = new Set(values.filter((value) => !isEmpty(value)).map((value) => JSON.stringify(value))).size;
    return { name, inferredType, missingCount, completeness: sampled.length ? Math.round(((sampled.length - missingCount) / sampled.length) * 100) : 0, distinctCount, invalidDateCount };
  });

  const fingerprints = sampled.map((row) => JSON.stringify(columnNames.map((name) => safeCell(row[name]))));
  const duplicateRowCount = fingerprints.length - new Set(fingerprints).size;
  const missingValueCount = columns.reduce((total, column) => total + column.missingCount, 0);
  const totalCells = Math.max(sampled.length * Math.max(columnNames.length, 1), 1);
  const missingPenalty = (missingValueCount / totalCells) * 65;
  const duplicatePenalty = sampled.length ? (duplicateRowCount / sampled.length) * 25 : 0;
  const typePenalty = columns.length ? (columns.filter((column) => column.inferredType === "mixed").length / columns.length) * 10 : 0;
  const qualityScore = Math.max(0, Math.min(100, Math.round(100 - missingPenalty - duplicatePenalty - typePenalty)));
  return { rowCount: rows.length, columnCount: columnNames.length, duplicateRowCount, missingValueCount, qualityScore, suggestedMetrics: detectSuggestedMetrics(columns), columns };
}

function rowsFromSheet(sheet: XLSX.WorkSheet): DatasetRow[] {
  const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: null, raw: false });
  const headers = (matrix[0] || []).map((header, index) => String(header || `coluna_${index + 1}`).trim());
  return matrix.slice(1).filter((row) => row.some((value) => !isEmpty(value))).map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index] ?? null])));
}

export function parseDatasetRows(input: { fileName: string; contentType: string; data: Buffer }): DatasetRow[] {
  const extension = input.fileName.toLowerCase().split(".").pop();
  if (!supportedMimes.has(input.contentType) && !["csv", "json", "xlsx", "xls"].includes(extension || "")) throw new Error("O formato do ficheiro não é suportado. Envie CSV, XLSX ou JSON.");
  if (extension === "json" || input.contentType === "application/json") {
    const parsed = JSON.parse(input.data.toString("utf8")) as unknown;
    const rows = Array.isArray(parsed) ? parsed : [parsed];
    if (!rows.every((row) => row && typeof row === "object" && !Array.isArray(row))) throw new Error("O JSON deve conter um objeto ou uma lista de objetos.");
    return rows as DatasetRow[];
  }
  const workbook = XLSX.read(input.data, { type: "buffer", cellDates: true });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) throw new Error("O ficheiro não contém uma folha de dados.");
  return rowsFromSheet(workbook.Sheets[firstSheetName]);
}

export function parseAndProfileFile(input: { fileName: string; contentType: string; data: Buffer }): DatasetProfile {
  return profileRows(parseDatasetRows(input));
}
