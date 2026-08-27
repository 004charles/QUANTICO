import { describe, expect, it } from "vitest";
import { evaluateAlertCondition } from "./alert-rules";

const dates = ["2026-01-01", "2026-02-01", "2026-03-01", "2026-04-01"].map((value) => new Date(value));
const empty = { revenue: [], sales: [], retention: [] };

describe("alert evaluation", () => {
  it("triggers a revenue anomaly only when its variation exceeds the configured threshold", () => {
    const revenue = dates.map((date, index) => ({ date, value: [100, 100, 100, 200][index] }));
    expect(evaluateAlertCondition({ alertType: "revenue_anomaly", threshold: 30 }, { ...empty, revenue })?.severity).toBe("high");
    expect(evaluateAlertCondition({ alertType: "revenue_anomaly", threshold: 150 }, { ...empty, revenue })).toBeNull();
  });

  it("triggers sales goals below target and customer risk at or above threshold", () => {
    expect(evaluateAlertCondition({ alertType: "sales_goal", threshold: 20 }, { ...empty, sales: [{ date: dates[0], value: 12 }] })?.currentValue).toBe(12);
    expect(evaluateAlertCondition({ alertType: "customer_risk", threshold: 3 }, { ...empty, retention: [{ date: dates[0], value: 80, secondaryValue: 4 }] })?.severity).toBe("medium");
    expect(evaluateAlertCondition({ alertType: "customer_risk", threshold: 5 }, { ...empty, retention: [{ date: dates[0], value: 80, secondaryValue: 4 }] })).toBeNull();
  });
});
