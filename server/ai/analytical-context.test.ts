import { describe, expect, it } from "vitest";
import { buildAnalyticalEnhancements } from "./analytical-context";

describe("buildAnalyticalEnhancements", () => {
  it("creates an evidence-backed chart and comparison from metric points", () => {
    const result = buildAnalyticalEnhancements([
      { date: new Date("2026-07-01T00:00:00Z"), value: 100 },
      { date: new Date("2026-08-01T00:00:00Z"), value: 120 },
    ]);
    expect(result.visualization?.data).toHaveLength(2);
    expect(result.comparison).toMatchObject({ currentValue: 120, previousValue: 100, variationPercent: 20 });
  });

  it("does not produce a comparison when one period is unavailable", () => {
    const result = buildAnalyticalEnhancements([{ date: new Date("2026-08-01T00:00:00Z"), value: 120 }]);
    expect(result.visualization).toBeDefined();
    expect(result.comparison).toBeUndefined();
  });
});
