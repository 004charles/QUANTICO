import { describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const mocks = vi.hoisted(() => ({
  organization: { id: 19, name: "Workspace seguro", industry: "Serviços", currency: "AOA", membershipRole: "owner" as const, isDemo: false },
  createDataSource: vi.fn(),
  listDataSources: vi.fn(),
  testDataSource: vi.fn(),
}));

vi.mock("./db", () => ({ getCurrentOrganization: vi.fn(async () => mocks.organization), writeAnalyticalQueryAudit: vi.fn() }));
vi.mock("./data-connectors", () => ({ connectorTypes: ["postgresql", "mysql", "sqlserver", "sqlite", "google_sheets", "rest_api", "webhook"], createDataSource: mocks.createDataSource, listDataSources: mocks.listDataSources, testDataSource: mocks.testDataSource }));

import { appRouter } from "./routers";

function caller() {
  return appRouter.createCaller({ user: { id: 1, openId: "connector-user", name: "Connector User", email: "connector@example.com", loginMethod: "manus", role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() }, req: { headers: { cookie: "app_session_id=session" } } as TrpcContext["req"], res: {} as TrpcContext["res"] });
}

describe("data connector router", () => {
  it("creates a source inside the server-resolved organization", async () => {
    mocks.createDataSource.mockResolvedValue({ id: 4, organizationId: 19, hasCredential: true });
    await caller().data.createSource({ name: "ERP", type: "postgresql", config: { host: "db.example.co.ao", port: "5432" }, secret: "not-returned" });
    expect(mocks.createDataSource).toHaveBeenCalledWith(expect.objectContaining({ organizationId: 19, name: "ERP" }));
  });

  it("returns a safe connection failure only through the active organization scope", async () => {
    mocks.testDataSource.mockResolvedValue({ ok: false, sourceId: 4, message: "Indique uma credencial para testar esta base de dados." });
    const result = await caller().data.testSource({ sourceId: 4 });
    expect(result).toMatchObject({ ok: false, sourceId: 4 });
    expect(mocks.testDataSource).toHaveBeenCalledWith({ organizationId: 19, sourceId: 4 });
  });
});
