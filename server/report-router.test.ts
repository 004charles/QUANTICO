import { describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const mocks = vi.hoisted(() => ({
  organization: { id: 7, name: "Organização de teste", industry: "comércio", currency: "AOA", membershipRole: "owner" as const, isDemo: false },
  createReport: vi.fn(), listReports: vi.fn(), getReportForOrganization: vi.fn(), persistReportSchedule: vi.fn(), generateReportArtifact: vi.fn(), listReportArtifacts: vi.fn(), createHeartbeatJob: vi.fn(),
}));

vi.mock("./db", () => ({ getCurrentOrganization: vi.fn(async () => mocks.organization), writeAnalyticalQueryAudit: vi.fn() }));
vi.mock("./reports", () => ({ createReport: mocks.createReport, listReports: mocks.listReports, getReportForOrganization: mocks.getReportForOrganization, persistReportSchedule: mocks.persistReportSchedule, generateReportArtifact: mocks.generateReportArtifact, listReportArtifacts: mocks.listReportArtifacts }));
vi.mock("./_core/heartbeat", () => ({ createHeartbeatJob: mocks.createHeartbeatJob }));

import { appRouter } from "./routers";

function caller() {
  return appRouter.createCaller({ user: { id: 1, openId: "test-user", name: "Test User", email: "test@example.com", loginMethod: "manus", role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() }, req: { headers: { cookie: "app_session_id=session" } } as TrpcContext["req"], res: {} as TrpcContext["res"] });
}

describe("reports router", () => {
  it("lists reports only through the current organization scope", async () => {
    mocks.listReports.mockResolvedValue([{ id: 9, organizationId: 7, name: "Visão mensal" }]);
    const result = await caller().reports.list();
    expect(result).toHaveLength(1);
    expect(mocks.listReports).toHaveBeenCalledWith(7);
  });

  it("creates a report inside the current organization", async () => {
    mocks.createReport.mockResolvedValue({ id: 9, name: "Visão mensal", category: "executive", cadence: "monthly" });
    const result = await caller().reports.create({ name: "Visão mensal", category: "executive", cadence: "monthly" });
    expect(result.id).toBe(9);
    expect(mocks.createReport).toHaveBeenCalledWith(expect.objectContaining({ organizationId: 7 }));
  });

  it("generates an artifact only for a report belonging to the organization", async () => {
    mocks.getReportForOrganization.mockResolvedValue({ id: 9, organizationId: 7, name: "Visão mensal", category: "executive", cadence: "monthly" });
    mocks.generateReportArtifact.mockResolvedValue({ id: 3, title: "Visão mensal", url: "/manus-storage/reports/monthly.md" });
    const result = await caller().reports.generate({ reportId: 9 });
    expect(result.url).toContain("/manus-storage/");
    expect(mocks.getReportForOrganization).toHaveBeenCalledWith(9, 7);
    expect(mocks.generateReportArtifact).toHaveBeenCalledWith(expect.objectContaining({ organizationId: 7 }), "Organização de teste");
  });

  it("does not generate a report outside the current organization", async () => {
    mocks.getReportForOrganization.mockResolvedValue(undefined);
    await expect(caller().reports.generate({ reportId: 99 })).rejects.toThrow("não encontrado neste workspace");
  });

  it("creates a cron job with a persisted task id for a recurring report", async () => {
    mocks.getReportForOrganization.mockResolvedValue({ id: 9, organizationId: 7, name: "Visão mensal", category: "executive", cadence: "monthly", scheduleCronTaskUid: null });
    mocks.createHeartbeatJob.mockResolvedValue({ taskUid: "cron-42", nextExecutionAt: "2026-09-01T07:00:00.000Z" });
    const result = await caller().reports.schedule({ reportId: 9 });
    expect(result.taskUid).toBe("cron-42");
    expect(mocks.createHeartbeatJob).toHaveBeenCalledWith(expect.objectContaining({ path: "/api/scheduled/generate-report", cron: "0 0 7 1 * *" }), "session");
    expect(mocks.persistReportSchedule).toHaveBeenCalledWith(9, 7, "cron-42");
  });
});
