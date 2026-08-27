import { describe, expect, it } from "vitest";
import { extractMetricSnapshots } from "./metric-extraction";

describe("explicit dataset mapping", () => {
  it("uses the selected fields when source headers are not recognised automatically", () => {
    const snapshots = extractMetricSnapshots([
      { "Quando": "2026-08-03", "Montante líquido": "1200", "Conta comercial": "A-12", "Documento": "7" },
      { "Quando": "2026-08-10", "Montante líquido": "800", "Conta comercial": "B-01", "Documento": "8" },
    ], { date: "Quando", revenue: "Montante líquido", customer: "Conta comercial", order: "Documento" });
    expect(snapshots).toHaveLength(1);
    expect(snapshots[0]).toMatchObject({ totalRevenue: 2000, salesCount: 2, activeCustomers: 2 });
  });
});
