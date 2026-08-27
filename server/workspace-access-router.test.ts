import { describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const mocks = vi.hoisted(() => ({
  organization: { id: 21, name: "Organização de acessos", industry: "Tecnologia", currency: "AOA", membershipRole: "owner" as const, isDemo: false },
  getWorkspacePreferences: vi.fn(),
  saveWorkspacePreferences: vi.fn(),
  listOrganizationMembers: vi.fn(),
}));

vi.mock("./db", () => ({ getCurrentOrganization: vi.fn(async () => mocks.organization), writeAnalyticalQueryAudit: vi.fn() }));
vi.mock("./workspace-access", () => ({
  workspaceAreas: ["executive", "sales", "customers", "operations"],
  canManageWorkspace: (role: string) => role === "owner" || role === "admin",
  canManageData: (role: string) => role !== "viewer" && role !== "demo",
  canManageReports: (role: string) => role !== "viewer" && role !== "demo",
  getWorkspacePreferences: mocks.getWorkspacePreferences,
  saveWorkspacePreferences: mocks.saveWorkspacePreferences,
  listOrganizationMembers: mocks.listOrganizationMembers,
}));

import { appRouter } from "./routers";

function caller() {
  return appRouter.createCaller({ user: { id: 8, openId: "access-user", name: "Access User", email: "access@example.com", loginMethod: "manus", role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() }, req: { headers: { cookie: "app_session_id=session" } } as TrpcContext["req"], res: {} as TrpcContext["res"] });
}

describe("workspace preferences router", () => {
  it("persists area choices inside the active organization and current user", async () => {
    mocks.saveWorkspacePreferences.mockResolvedValue({ defaultArea: "sales", visibleAreas: ["executive", "sales"] });
    await caller().organization.savePreferences({ defaultArea: "sales", visibleAreas: ["executive", "sales"] });
    expect(mocks.saveWorkspacePreferences).toHaveBeenCalledWith({ organizationId: 21, userId: 8, defaultArea: "sales", visibleAreas: ["executive", "sales"] });
  });

  it("allows only managers to request organization members", async () => {
    mocks.listOrganizationMembers.mockResolvedValue([{ userId: 8, role: "owner" }]);
    await expect(caller().organization.members()).resolves.toHaveLength(1);
    expect(mocks.listOrganizationMembers).toHaveBeenCalledWith(21);
  });
});
