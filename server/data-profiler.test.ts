import { describe, expect, it } from "vitest";
import { profileRows } from "./data-profiler";

describe("profileRows", () => {
  it("profiles columns, missing values, duplicate rows and suggested metrics", () => {
    const profile = profileRows([
      { data: "2026-08-01", cliente: "A", receita: "1200 Kz", vendas: 3 },
      { data: "2026-08-02", cliente: "B", receita: "2400 Kz", vendas: 4 },
      { data: "2026-08-02", cliente: "B", receita: "2400 Kz", vendas: 4 },
      { data: null, cliente: "C", receita: "", vendas: 1 },
    ]);
    expect(profile.rowCount).toBe(4);
    expect(profile.duplicateRowCount).toBe(1);
    expect(profile.missingValueCount).toBe(2);
    expect(profile.suggestedMetrics).toContain("Receita total e ticket médio");
    expect(profile.suggestedMetrics).toContain("Clientes ativos, recorrência e retenção");
    expect(profile.qualityScore).toBeLessThan(100);
  });
});
