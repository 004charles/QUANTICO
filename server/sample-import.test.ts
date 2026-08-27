import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseDatasetRows, profileRows } from "./data-profiler";
import { extractMetricSnapshots } from "./metric-extraction";

describe("ficheiro sintético de teste", () => {
  it("é lido, perfilado e convertido em métricas mensais reconhecidas", () => {
    const data = readFileSync("/home/ubuntu/quantico-test-data/quantico_vendas_teste.csv");
    const rows = parseDatasetRows({ fileName: "quantico_vendas_teste.csv", contentType: "text/csv", data });
    const profile = profileRows(rows);
    const snapshots = extractMetricSnapshots(rows);
    expect(profile).toMatchObject({ rowCount: 21, columnCount: 7, missingValueCount: 0 });
    expect(snapshots).toHaveLength(4);
    expect(snapshots.at(-1)).toMatchObject({ totalRevenue: 831000, salesCount: 6, activeCustomers: 6 });
  });
});
