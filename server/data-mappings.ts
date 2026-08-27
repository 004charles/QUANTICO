import { and, eq } from "drizzle-orm";
import { datasetFieldMappings, executiveMetricSnapshots, importedDatasets, productMetricSnapshots } from "../drizzle/schema";
import { getDb } from "./db";
import { parseDatasetRows, type DatasetProfile, type DatasetRow } from "./data-profiler";
import { extractMetricSnapshots, extractProductMetrics, type BusinessFieldMapping } from "./metric-extraction";
import { storageGetSignedUrl } from "./storage";

export const businessFields = ["date", "revenue", "sales", "customer", "product", "order"] as const;
export type BusinessField = (typeof businessFields)[number];
export type DatasetMapping = Partial<Record<BusinessField, string>>;

function cleanMapping(mapping: DatasetMapping, profile: DatasetProfile) {
  const allowedColumns = new Set(profile.columns.map((column) => column.name));
  const result: DatasetMapping = {};
  for (const field of businessFields) {
    const column = mapping[field]?.trim();
    if (!column) continue;
    if (!allowedColumns.has(column)) throw new Error(`A coluna selecionada para ${field} não pertence a este ficheiro.`);
    result[field] = column;
  }
  if (!Object.keys(result).length) throw new Error("Selecione ao menos um campo de negócio para guardar o mapeamento.");
  return result;
}

export async function listDatasetMappings(organizationId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(datasetFieldMappings).where(eq(datasetFieldMappings.organizationId, organizationId));
}

export async function saveDatasetMapping(input: { organizationId: number; datasetId: number; mapping: DatasetMapping }) {
  const db = await getDb();
  if (!db) throw new Error("A base de dados não está disponível para guardar o mapeamento.");
  const dataset = (await db.select().from(importedDatasets).where(and(eq(importedDatasets.id, input.datasetId), eq(importedDatasets.organizationId, input.organizationId))).limit(1))[0];
  if (!dataset) throw new Error("Ficheiro não encontrado nesta organização.");
  const mapping = cleanMapping(input.mapping, dataset.profile as DatasetProfile);
  await db.insert(datasetFieldMappings).values({ organizationId: input.organizationId, datasetId: input.datasetId, mapping }).onDuplicateKeyUpdate({ set: { mapping } });
  await rebuildOrganizationMetrics(input.organizationId);
  return { datasetId: input.datasetId, mapping };
}

/** Rebuilds aggregate snapshots from tenant-owned datasets only, after all input files were safely parsed. */
export async function rebuildOrganizationMetrics(organizationId: number) {
  const db = await getDb();
  if (!db) throw new Error("A base de dados não está disponível para actualizar os indicadores.");
  const datasets = await db.select().from(importedDatasets).where(eq(importedDatasets.organizationId, organizationId));
  const mappings = await listDatasetMappings(organizationId);
  const mappingByDataset = new Map(mappings.map((item) => [item.datasetId, item.mapping as DatasetMapping]));
  const aggregate: Array<ReturnType<typeof extractMetricSnapshots>[number] & { sourceDatasetId: number }> = [];
  const products: Array<ReturnType<typeof extractProductMetrics>[number] & { sourceDatasetId: number }> = [];
  for (const dataset of datasets) {
    const signedUrl = await storageGetSignedUrl(dataset.fileKey);
    const response = await fetch(signedUrl);
    if (!response.ok) throw new Error(`Não foi possível reler o ficheiro ${dataset.fileName} para aplicar o mapeamento.`);
    const rows: DatasetRow[] = parseDatasetRows({ fileName: dataset.fileName, contentType: dataset.contentType, data: Buffer.from(await response.arrayBuffer()) });
    const mapping = mappingByDataset.get(dataset.id) as BusinessFieldMapping | undefined;
    aggregate.push(...extractMetricSnapshots(rows, mapping).map((snapshot) => ({ ...snapshot, sourceDatasetId: dataset.id })));
    products.push(...extractProductMetrics(rows, mapping).map((metric) => ({ ...metric, sourceDatasetId: dataset.id })));
  }
  await db.transaction(async (tx) => {
    await tx.delete(executiveMetricSnapshots).where(eq(executiveMetricSnapshots.organizationId, organizationId));
    await tx.delete(productMetricSnapshots).where(eq(productMetricSnapshots.organizationId, organizationId));
    if (aggregate.length) await tx.insert(executiveMetricSnapshots).values(aggregate.map((snapshot) => ({ organizationId, ...snapshot })));
    if (products.length) await tx.insert(productMetricSnapshots).values(products.map((metric) => ({ organizationId, ...metric })));
  });
  return aggregate.length;
}
