import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  source: undefined as any,
  where: vi.fn(async () => undefined),
  set: vi.fn(),
  update: vi.fn(),
}));

vi.mock("./db", () => ({
  getDb: vi.fn(async () => ({
    select: () => ({ from: () => ({ where: () => ({ limit: async () => mocks.source ? [mocks.source] : [] }) }) }),
    update: (...args: unknown[]) => { mocks.update(...args); return { set: (value: unknown) => { mocks.set(value); return { where: mocks.where }; } }; },
  })),
}));

import { encryptConnectorCredential, testDataSource } from "./data-connectors";

function source(overrides: Record<string, unknown> = {}) {
  return { id: 3, organizationId: 11, name: "Fonte de teste", type: "postgresql", connectionConfig: { host: "db.example.co.ao", port: "5432", database: "sales", username: "reader", ssl: "obrigatório" }, credentialCiphertext: null, status: "pending", healthScore: 0, lastSyncedAt: null, createdAt: new Date(), updatedAt: new Date(), ...overrides };
}

describe("real connector connection checks", () => {
  beforeEach(() => { mocks.source = undefined; mocks.where.mockClear(); mocks.set.mockClear(); mocks.update.mockClear(); vi.unstubAllGlobals(); });

  it.each(["postgresql", "mysql", "google_sheets"])("moves %s to error without making a remote call when credentials are absent", async (type) => {
    mocks.source = source({ type, connectionConfig: type === "google_sheets" ? { spreadsheetUrl: "https://docs.google.com/spreadsheets/d/test-sheet-id" } : source().connectionConfig });
    const result = await testDataSource({ organizationId: 11, sourceId: 3 });
    expect(result).toMatchObject({ ok: false, sourceId: 3 });
    expect(result.message).toMatch(/credencial/i);
    expect(mocks.set).toHaveBeenCalledWith(expect.objectContaining({ status: "error", healthScore: 0 }));
  });

  it("moves a REST source to error when the validated endpoint rejects the request", async () => {
    mocks.source = source({ type: "rest_api", connectionConfig: { endpointUrl: "https://api.example.co.ao/health" }, credentialCiphertext: encryptConnectorCredential("test-token") });
    vi.stubGlobal("fetch", vi.fn(async () => new Response("denied", { status: 401 })));
    const result = await testDataSource({ organizationId: 11, sourceId: 3 });
    expect(result).toMatchObject({ ok: false, message: "O endpoint não aceitou a verificação de acesso." });
    expect(mocks.set).toHaveBeenCalledWith(expect.objectContaining({ status: "error", healthScore: 0 }));
  });

  it("moves a REST source to connected after a successful metadata-only check", async () => {
    mocks.source = source({ type: "rest_api", connectionConfig: { endpointUrl: "https://api.example.co.ao/health" }, credentialCiphertext: encryptConnectorCredential("test-token") });
    vi.stubGlobal("fetch", vi.fn(async () => new Response("{}", { status: 200 })));
    const result = await testDataSource({ organizationId: 11, sourceId: 3 });
    expect(result).toMatchObject({ ok: true, sourceId: 3 });
    expect(mocks.set).toHaveBeenCalledWith(expect.objectContaining({ status: "connected", healthScore: 100 }));
  });

  it("does not look up or update a connector outside the active organization", async () => {
    mocks.source = undefined;
    await expect(testDataSource({ organizationId: 99, sourceId: 3 })).rejects.toThrow("não encontrado nesta organização");
    expect(mocks.set).not.toHaveBeenCalled();
  });
});
