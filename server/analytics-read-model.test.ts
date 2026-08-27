import { describe, expect, it } from "vitest";
import { approvedMetrics, buildMetricQuery } from "./analytics-sql";
import { projectMetricRows } from "./analytics-read-model";

describe("approved analytical read model", () => {
  it("exposes only a fixed semantic metric catalogue", () => {
    expect(approvedMetrics).toEqual(["revenue", "sales", "customers", "forecast", "pipeline", "retention"]);
  });

  it("compiles a tenant-parameterized statement for every approved metric", () => {
    for (const metric of approvedMetrics) {
      const compiled = buildMetricQuery(metric, 7);
      expect(compiled.statement).toContain("organizationId = ?");
      expect(compiled.params).toEqual([7]);
    }
  });

  it("projects a permitted tenant-scoped metric row into an analytical response", () => {
    const result = projectMetricRows("sales", 7, [{
      id: 1,
      organizationId: 7,
      metricDate: new Date("2026-08-01T00:00:00.000Z"),
      totalRevenue: 0,
      salesCount: 19,
      averageTicket: 42000,
      activeCustomers: 0,
      retainedCustomers: 0,
      forecastRevenue: 0,
      confidence: 0,
      pipelineValue: 0,
      conversionRate: 0,
      retentionRate: 0,
      churnRiskCount: 0,
      createdAt: new Date("2026-08-01T00:00:00.000Z"),
    }]);
    expect(result).toEqual([{ date: new Date("2026-08-01T00:00:00.000Z"), value: 19, secondaryValue: 42000 }]);
  });

  it("does not project a metric row from another organization", () => {
    expect(() => projectMetricRows("revenue", 7, [{
      id: 2,
      organizationId: 8,
      metricDate: new Date(),
      totalRevenue: 1,
      salesCount: 0,
      averageTicket: 0,
      activeCustomers: 0,
      retainedCustomers: 0,
      forecastRevenue: 0,
      confidence: 0,
      pipelineValue: 0,
      conversionRate: 0,
      retentionRate: 0,
      churnRiskCount: 0,
      createdAt: new Date(),
    }])).toThrow("não pertence à organização atual");
  });
});
