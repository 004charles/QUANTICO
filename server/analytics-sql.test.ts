import { describe, expect, it } from "vitest";
import { buildMetricQuery, validateReadOnlySql } from "./analytics-sql";

describe("validateReadOnlySql", () => {
  it("accepts a single analytical SELECT query", () => {
    expect(validateReadOnlySql(" SELECT revenue FROM sales_metrics WHERE organizationId = 7 ")).toEqual({
      allowed: true,
      statement: "SELECT revenue FROM sales_metrics WHERE organizationId = 7",
    });
  });

  it.each([
    "DELETE FROM customers",
    "SELECT * FROM sales; DROP TABLE sales",
    "SELECT * FROM information_schema.tables",
    "SELECT SLEEP(4)",
    "UPDATE sales SET revenue = 0",
  ])("rejects an unsafe statement: %s", (statement) => {
    expect(validateReadOnlySql(statement).allowed).toBe(false);
  });

  it("only builds parameterized queries with a server-owned organization id", () => {
    expect(buildMetricQuery("revenue", 42)).toEqual({
      statement: "SELECT metric_date, total_revenue FROM executive_metric_snapshots WHERE organizationId = ? ORDER BY metric_date DESC LIMIT 24",
      params: [42],
    });
  });
});
