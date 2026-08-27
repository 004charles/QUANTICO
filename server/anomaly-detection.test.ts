import { describe, expect, it } from "vitest";
import { detectLatestMetricAnomaly } from "./anomaly-detection";

describe("detectLatestMetricAnomaly", () => {
  it("detects a substantial latest-period decline against the historical baseline", () => {
    const result = detectLatestMetricAnomaly([
      { date: new Date("2026-05-01"), value: 100 }, { date: new Date("2026-06-01"), value: 105 }, { date: new Date("2026-07-01"), value: 98 }, { date: new Date("2026-08-01"), value: 55 },
    ]);
    expect(result).toMatchObject({ deviationPercent: expect.any(Number), severity: "high" });
    expect(result?.deviationPercent).toBeLessThan(-30);
  });

  it("does not raise an anomaly for normal variation", () => {
    expect(detectLatestMetricAnomaly([
      { date: new Date("2026-05-01"), value: 100 }, { date: new Date("2026-06-01"), value: 105 }, { date: new Date("2026-07-01"), value: 98 }, { date: new Date("2026-08-01"), value: 102 },
    ])).toBeNull();
  });
});
