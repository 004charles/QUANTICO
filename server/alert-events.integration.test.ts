import { beforeEach, describe, expect, it, vi } from "vitest";
import { alertEvents, alertRules } from "../drizzle/schema";

const mocks = vi.hoisted(() => ({ getDb: vi.fn(), readApprovedMetric: vi.fn() }));
vi.mock("./db", () => ({ getDb: mocks.getDb }));
vi.mock("./analytics-read-model", () => ({ readApprovedMetric: mocks.readApprovedMetric }));
import { evaluateAlertRules } from "./alert-rules";

function chain<T>(rows: T[]) { return Object.assign(Promise.resolve(rows), { limit: async () => rows }); }

describe("alert event persistence", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("persists one triggered event, updates lastTriggeredAt, and does not duplicate it on the same day", async () => {
    const events: Array<Record<string, unknown>> = [];
    const inserted = vi.fn(async (value: Record<string, unknown>) => { events.push(value); return { affectedRows: 1 }; });
    const set = vi.fn(() => ({ where: vi.fn(async () => ({ affectedRows: 1 })) }));
    const db = {
      select: vi.fn(() => ({ from: (table: unknown) => ({ where: () => table === alertRules ? chain([{ id: 5, organizationId: 31, alertType: "sales_goal", threshold: 20, isActive: 1 }]) : chain(events) }) })),
      insert: vi.fn(() => ({ values: inserted })),
      update: vi.fn(() => ({ set })),
    };
    mocks.getDb.mockResolvedValue(db);
    mocks.readApprovedMetric.mockImplementation(async (metric: string) => ({ state: "ready", points: metric === "sales" ? [{ date: new Date("2026-08-01"), value: 12 }] : [] }));

    const first = await evaluateAlertRules(31);
    const second = await evaluateAlertRules(31);

    expect(first).toEqual({ evaluated: 1, created: [{ ruleId: 5, title: "Meta de vendas abaixo do limiar" }] });
    expect(second).toEqual({ evaluated: 1, created: [] });
    expect(inserted).toHaveBeenCalledTimes(1);
    expect(events[0]).toMatchObject({ organizationId: 31, alertRuleId: 5, currentValue: 12, threshold: 20 });
    expect(set).toHaveBeenCalledWith(expect.objectContaining({ lastTriggeredAt: expect.any(Date) }));
    expect(mocks.readApprovedMetric).toHaveBeenCalledWith("sales", 31);
    expect(alertEvents).toBeDefined();
  });
});
