import { describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const mocks = vi.hoisted(() => ({
  organization: { id: 31, name: "Organização comercial", industry: "Comércio", currency: "AOA", membershipRole: "owner" as const, isDemo: false },
  createGrowthAction: vi.fn(),
  setGrowthActionStatus: vi.fn(),
  updateGrowthActionResult: vi.fn(),
  addActionFollowUp: vi.fn(),
  listActionFollowUps: vi.fn(),
  listGrowthActions: vi.fn(),
  createAlertRule: vi.fn(),
  setAlertRuleActive: vi.fn(),
  listAlertRules: vi.fn(),
  listAlertEvents: vi.fn(),
  evaluateAlertRules: vi.fn(),
}));

vi.mock("./db", () => ({ getCurrentOrganization: vi.fn(async () => mocks.organization), writeAnalyticalQueryAudit: vi.fn() }));
vi.mock("./growth-actions", () => ({ actionTypes: ["reactivation", "upsell", "cross_sell", "efficiency", "custom"], actionStatuses: ["draft", "active", "completed", "archived"], createGrowthAction: mocks.createGrowthAction, setGrowthActionStatus: mocks.setGrowthActionStatus, updateGrowthActionResult: mocks.updateGrowthActionResult, addActionFollowUp: mocks.addActionFollowUp, listActionFollowUps: mocks.listActionFollowUps, listGrowthActions: mocks.listGrowthActions }));
vi.mock("./alert-rules", () => ({ alertTypes: ["revenue_anomaly", "sales_goal", "customer_risk"], createAlertRule: mocks.createAlertRule, setAlertRuleActive: mocks.setAlertRuleActive, listAlertRules: mocks.listAlertRules, listAlertEvents: mocks.listAlertEvents, evaluateAlertRules: mocks.evaluateAlertRules }));

import { appRouter } from "./routers";

function caller() { return appRouter.createCaller({ user: { id: 14, openId: "actions-user", name: "Actions User", email: "actions@example.com", loginMethod: "manus", role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() }, req: { headers: { cookie: "app_session_id=session" } } as TrpcContext["req"], res: {} as TrpcContext["res"] }); }

describe("actions and alerts router", () => {
  it("creates a growth action within the server-resolved organization", async () => {
    mocks.createGrowthAction.mockResolvedValue({ id: 2, status: "draft" });
    await caller().actions.create({ title: "Recuperar clientes", actionType: "reactivation", segment: "Inactivos", estimatedRevenue: 120000 });
    expect(mocks.createGrowthAction).toHaveBeenCalledWith(expect.objectContaining({ organizationId: 31, createdByUserId: 14, title: "Recuperar clientes" }));
  });

  it("updates action and alert state only with the active organization id", async () => {
    mocks.setGrowthActionStatus.mockResolvedValue({ actionId: 2, status: "active" });
    mocks.setAlertRuleActive.mockResolvedValue({ ruleId: 5, isActive: false });
    await caller().actions.setStatus({ actionId: 2, status: "active" });
    await caller().alerts.setActive({ ruleId: 5, isActive: false });
    expect(mocks.setGrowthActionStatus).toHaveBeenCalledWith({ organizationId: 31, actionId: 2, status: "active" });
    expect(mocks.setAlertRuleActive).toHaveBeenCalledWith({ organizationId: 31, ruleId: 5, isActive: false });
  });

  it("records results and follow-ups only for the active organization action", async () => {
    mocks.updateGrowthActionResult.mockResolvedValue({ actionId: 2, progress: 60 });
    mocks.addActionFollowUp.mockResolvedValue({ id: 8, actionId: 2, progress: 60 });
    mocks.listActionFollowUps.mockResolvedValue([{ id: 8, actionId: 2 }]);
    await caller().actions.updateResult({ actionId: 2, progress: 60, actualRevenue: 42000, status: "active", resultNotes: "Contactos iniciados", assigneeName: "Rui" });
    await caller().actions.addFollowUp({ actionId: 2, note: "Cliente respondeu", progress: 60 });
    await caller().actions.followUps({ actionId: 2 });
    expect(mocks.updateGrowthActionResult).toHaveBeenCalledWith(expect.objectContaining({ organizationId: 31, actionId: 2, actualRevenue: 42000 }));
    expect(mocks.addActionFollowUp).toHaveBeenCalledWith(expect.objectContaining({ organizationId: 31, createdByUserId: 14, actionId: 2 }));
    expect(mocks.listActionFollowUps).toHaveBeenCalledWith(31, 2);
  });

  it("evaluates and lists alert events in the server-resolved organization", async () => {
    mocks.evaluateAlertRules.mockResolvedValue({ evaluated: 1, created: [{ ruleId: 5, title: "Meta" }] });
    mocks.listAlertEvents.mockResolvedValue([{ id: 7, organizationId: 31, alertRuleId: 5 }]);
    const result = await caller().alerts.evaluate();
    const events = await caller().alerts.events();
    expect(result.created).toHaveLength(1);
    expect(events).toHaveLength(1);
    expect(mocks.evaluateAlertRules).toHaveBeenCalledWith(31);
    expect(mocks.listAlertEvents).toHaveBeenCalledWith(31);
  });
});
