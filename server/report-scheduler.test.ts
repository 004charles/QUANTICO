import { describe, expect, it } from "vitest";
import { buildReportPreview, cronForCadence } from "./report-scheduler";

describe("report scheduler", () => {
  it("maps each recurring cadence to a six-field UTC cron", () => {
    expect(cronForCadence("daily")).toBe("0 0 7 * * *");
    expect(cronForCadence("weekly")).toBe("0 0 7 * * 1");
    expect(cronForCadence("monthly")).toBe("0 0 7 1 * *");
  });

  it("rejects a manual report from automatic scheduling", () => {
    expect(() => cronForCadence("manual")).toThrow("não podem receber cadência");
  });

  it("creates a transparent preview that does not fabricate business metrics", () => {
    const preview = buildReportPreview({ name: "Visão mensal", category: "executivo", cadence: "monthly", organizationName: "Quantico", generatedAt: new Date("2026-08-27T00:00:00Z") });
    expect(preview).toContain("Os indicadores serão preenchidos");
  });
});
