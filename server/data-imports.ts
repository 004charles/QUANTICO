import { desc, eq } from "drizzle-orm";
import { importedDatasets } from "../drizzle/schema";
import { getDb } from "./db";
import { parseAndProfileFile, type DatasetProfile } from "./data-profiler";
import { storagePut } from "./storage";

const MAX_FILE_BYTES = 8 * 1024 * 1024;

function safeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 180) || "dataset";
}

export async function importDataset(input: { organizationId: number; fileName: string; contentType: string; contentBase64: string }) {
  const data = Buffer.from(input.contentBase64, "base64");
  if (!data.length || data.length > MAX_FILE_BYTES) throw new Error("O ficheiro deve ter até 8 MB.");
  const profile = parseAndProfileFile({ fileName: input.fileName, contentType: input.contentType, data });
  const stored = await storagePut(`organizations/${input.organizationId}/datasets/${safeFileName(input.fileName)}`, data, input.contentType);
  const db = await getDb();
  if (!db) throw new Error("A base de dados não está disponível para registrar a importação.");
  const [created] = await db.insert(importedDatasets).values({ organizationId: input.organizationId, fileName: input.fileName.slice(0, 255), fileKey: stored.key, contentType: input.contentType, rowCount: profile.rowCount, qualityScore: profile.qualityScore, profile }).$returningId();
  return { id: created?.id, fileName: input.fileName, storageUrl: stored.url, profile };
}

export async function listImportedDatasets(organizationId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(importedDatasets).where(eq(importedDatasets.organizationId, organizationId)).orderBy(desc(importedDatasets.createdAt)).limit(20);
}

export type { DatasetProfile };
