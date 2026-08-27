import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { and, desc, eq } from "drizzle-orm";
import { GoogleAuth } from "google-auth-library";
import mysql from "mysql2/promise";
import { Client as PostgresClient } from "pg";
import { dataSources } from "../drizzle/schema";
import { ENV } from "./_core/env";
import { getDb } from "./db";

export const connectorTypes = ["postgresql", "mysql", "sqlserver", "sqlite", "google_sheets", "rest_api", "webhook"] as const;
export type ConnectorType = (typeof connectorTypes)[number];
type ConnectorConfig = Record<string, string>;

const configKeys: Record<ConnectorType, readonly string[]> = {
  postgresql: ["host", "port", "database", "username", "ssl"],
  mysql: ["host", "port", "database", "username", "ssl"],
  sqlserver: ["host", "port", "database", "username", "ssl"],
  sqlite: ["database"],
  google_sheets: ["spreadsheetUrl", "worksheetName"],
  rest_api: ["endpointUrl"],
  webhook: ["endpointName"],
};

function encryptionKey() {
  if (!ENV.cookieSecret) throw new Error("A chave de segurança do servidor não está disponível para proteger esta credencial.");
  return createHash("sha256").update(`quantico-connectors:${ENV.cookieSecret}`).digest();
}

/** Encrypts connector credentials before persistence; ciphertext is never returned to the client. */
export function encryptConnectorCredential(secret: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(secret, "utf8"), cipher.final()]);
  return `${iv.toString("base64url")}.${cipher.getAuthTag().toString("base64url")}.${encrypted.toString("base64url")}`;
}

export function decryptConnectorCredential(ciphertext: string) {
  const [ivText, tagText, valueText] = ciphertext.split(".");
  if (!ivText || !tagText || !valueText) throw new Error("Credencial de conector inválida.");
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(ivText, "base64url"));
  decipher.setAuthTag(Buffer.from(tagText, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(valueText, "base64url")), decipher.final()]).toString("utf8");
}

function sanitizeConfig(type: ConnectorType, input: ConnectorConfig) {
  return Object.fromEntries(configKeys[type]
    .map((key) => [key, input[key]?.trim().slice(0, 1_000)] as const)
    .filter(([, value]) => Boolean(value)));
}

function isPublicHost(host: string) {
  const value = host.trim().toLowerCase();
  if (!value || value === "localhost" || value.endsWith(".localhost") || value === "::1" || value.startsWith("127.") || value.startsWith("10.") || value.startsWith("192.168.") || value.startsWith("169.254.")) return false;
  return !/^172\.(1[6-9]|2\d|3[0-1])\./.test(value);
}

function requirePublicHost(config: ConnectorConfig) {
  const port = Number(config.port);
  if (!isPublicHost(config.host ?? "") || !Number.isInteger(port) || port < 1 || port > 65_535) throw new Error("O servidor ou a porta indicada não é um destino externo permitido.");
  return { host: config.host!, port };
}

function spreadsheetId(url?: string) {
  const match = url?.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  if (!match?.[1]) throw new Error("Indique uma ligação válida do Google Sheets.");
  return match[1];
}

async function testPostgres(config: ConnectorConfig, secret?: string) {
  if (!secret) throw new Error("Indique uma credencial para testar esta base de dados.");
  const { host, port } = requirePublicHost(config);
  const client = new PostgresClient({ host, port, database: config.database, user: config.username, password: secret, ssl: config.ssl?.toLowerCase() === "obrigatório" ? { rejectUnauthorized: true } : undefined, connectionTimeoutMillis: 7_000 });
  try { await client.connect(); await client.query("SELECT 1 AS quantico_connection_check"); } finally { await client.end().catch(() => undefined); }
}

async function testMysql(config: ConnectorConfig, secret?: string) {
  if (!secret) throw new Error("Indique uma credencial para testar esta base de dados.");
  const { host, port } = requirePublicHost(config);
  const connection = await mysql.createConnection({ host, port, database: config.database, user: config.username, password: secret, ssl: config.ssl?.toLowerCase() === "obrigatório" ? {} : undefined, connectTimeout: 7_000 });
  try { await connection.query("SELECT 1 AS quantico_connection_check"); } finally { await connection.end().catch(() => undefined); }
}

async function testGoogleSheets(config: ConnectorConfig, secret?: string) {
  if (!secret) throw new Error("Indique a credencial JSON da conta de serviço para testar esta planilha.");
  const credentials = JSON.parse(secret) as Record<string, string>;
  if (!credentials.client_email || !credentials.private_key) throw new Error("A credencial da conta de serviço não tem o formato esperado.");
  const auth = new GoogleAuth({ credentials, scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"] });
  const client = await auth.getClient();
  const response = await client.request<{ properties?: { title?: string } }>({ url: `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId(config.spreadsheetUrl)}?fields=properties.title` });
  if (!response.data?.properties?.title) throw new Error("A planilha não devolveu metadados para validação.");
}

async function testRestApi(config: ConnectorConfig, secret?: string) {
  const endpoint = new URL(config.endpointUrl ?? "");
  if (endpoint.protocol !== "https:" || !isPublicHost(endpoint.hostname)) throw new Error("O endpoint deve usar HTTPS e um domínio externo permitido.");
  const response = await fetch(endpoint, { method: "GET", redirect: "error", signal: AbortSignal.timeout(7_000), headers: { Accept: "application/json", ...(secret ? { Authorization: `Bearer ${secret}` } : {}) } });
  if (!response.ok) throw new Error("O endpoint não aceitou a verificação de acesso.");
}

function publicSource(source: typeof dataSources.$inferSelect) {
  const { credentialCiphertext: _credentialCiphertext, ...safe } = source;
  return { ...safe, hasCredential: Boolean(_credentialCiphertext) };
}

export async function createDataSource(input: { organizationId: number; name: string; type: ConnectorType; config: ConnectorConfig; secret?: string }) {
  const db = await getDb();
  if (!db) throw new Error("A base de dados não está disponível para guardar o conector.");
  const [created] = await db.insert(dataSources).values({
    organizationId: input.organizationId,
    name: input.name.trim().slice(0, 160),
    type: input.type,
    connectionConfig: sanitizeConfig(input.type, input.config),
    credentialCiphertext: input.secret?.trim() ? encryptConnectorCredential(input.secret.trim()) : null,
    status: "pending",
    healthScore: 0,
  }).$returningId();
  const row = await db.select().from(dataSources).where(eq(dataSources.id, created.id)).limit(1);
  return row[0] ? publicSource(row[0]) : null;
}

export async function listDataSources(organizationId: number) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select().from(dataSources).where(eq(dataSources.organizationId, organizationId)).orderBy(desc(dataSources.createdAt));
  return rows.map(publicSource);
}

/** Performs a metadata-only connection check for a source owned by the active organization. */
export async function testDataSource(input: { organizationId: number; sourceId: number }) {
  const db = await getDb();
  if (!db) throw new Error("A base de dados não está disponível para testar o conector.");
  const source = (await db.select().from(dataSources).where(and(eq(dataSources.id, input.sourceId), eq(dataSources.organizationId, input.organizationId))).limit(1))[0];
  if (!source) throw new Error("Conector não encontrado nesta organização.");
  const config = (source.connectionConfig ?? {}) as ConnectorConfig;
  const secret = source.credentialCiphertext ? decryptConnectorCredential(source.credentialCiphertext) : undefined;
  try {
    if (source.type === "postgresql") await testPostgres(config, secret);
    else if (source.type === "mysql") await testMysql(config, secret);
    else if (source.type === "google_sheets") await testGoogleSheets(config, secret);
    else if (source.type === "rest_api") await testRestApi(config, secret);
    else throw new Error("Este tipo de conector ainda não suporta teste remoto.");
    await db.update(dataSources).set({ status: "connected", healthScore: 100, lastSyncedAt: new Date() }).where(and(eq(dataSources.id, source.id), eq(dataSources.organizationId, input.organizationId)));
    return { ok: true as const, sourceId: source.id, message: "Ligação confirmada. A Quantico validou o acesso sem importar dados nesta etapa." };
  } catch (error) {
    await db.update(dataSources).set({ status: "error", healthScore: 0 }).where(and(eq(dataSources.id, source.id), eq(dataSources.organizationId, input.organizationId)));
    return { ok: false as const, sourceId: source.id, message: (error instanceof Error ? error.message : "Não foi possível confirmar a ligação.").slice(0, 220) };
  }
}
