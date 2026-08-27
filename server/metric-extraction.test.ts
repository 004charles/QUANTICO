import { describe, expect, it } from "vitest";
import { extractMetricSnapshots } from "./metric-extraction";

describe("extractMetricSnapshots", () => {
  it("aggregates recognized revenue, sale, customer and date columns by month", () => {
    const snapshots = extractMetricSnapshots([
      { Data: "2026-08-03", Receita: "1.500 Kz", Pedido: 2, Cliente: "A" },
      { Data: "2026-08-20", Receita: "2.000 Kz", Pedido: 1, Cliente: "B" },
    ]);
    expect(snapshots).toHaveLength(1);
    expect(snapshots[0]).toMatchObject({ totalRevenue: 3500, salesCount: 3, activeCustomers: 2, averageTicket: 1167, forecastRevenue: 3500 });
  });

  it("does not create metrics when there are no recognized business columns", () => {
    expect(extractMetricSnapshots([{ nota: "sem dados comerciais", etiqueta: "x" }])).toEqual([]);
  });
});
