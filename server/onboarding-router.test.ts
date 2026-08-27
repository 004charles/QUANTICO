import { describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const mocks = vi.hoisted(() => ({
  organization: { id: 17, name: "Organização segura", industry: "Comércio", currency: "AOA", membershipRole: "owner" as const, isDemo: false },
  getOrganizationSetup: vi.fn(),
  saveOrganizationSetup: vi.fn(),
}));

vi.mock("./db", () => ({ getCurrentOrganization: vi.fn(async () => mocks.organization), writeAnalyticalQueryAudit: vi.fn() }));
vi.mock("./onboarding", async (importOriginal) => ({ ...(await importOriginal<typeof import("./onboarding")>()), getOrganizationSetup: mocks.getOrganizationSetup, saveOrganizationSetup: mocks.saveOrganizationSetup }));

import { appRouter } from "./routers";

function caller() {
  return appRouter.createCaller({ user: { id: 1, openId: "test-user", name: "Test User", email: "test@example.com", loginMethod: "manus", role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() }, req: { headers: { cookie: "app_session_id=session" } } as TrpcContext["req"], res: {} as TrpcContext["res"] });
}

describe("organization onboarding router", () => {
  it("reads the profile only from the authenticated organization", async () => {
    mocks.getOrganizationSetup.mockResolvedValue({ organizationId: 17, onboardingComplete: 1 });
    const result = await caller().organization.setup();
    expect(result.profile).toMatchObject({ organizationId: 17 });
    expect(mocks.getOrganizationSetup).toHaveBeenCalledWith(17);
  });

  it("writes setup data with the server-resolved organization id", async () => {
    mocks.saveOrganizationSetup.mockResolvedValue({ organizationId: 17, onboardingComplete: 1 });
    await caller().organization.saveSetup({ organizationName: "Nova Organização", industry: "Logística", companySize: "mid_market", primaryGoal: "grow_revenue", dataReadiness: "spreadsheets" });
    expect(mocks.saveOrganizationSetup).toHaveBeenCalledWith(expect.objectContaining({ organizationId: 17, organizationName: "Nova Organização" }));
  });
});
