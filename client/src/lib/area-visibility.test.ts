import { describe, expect, it } from "vitest";
import { visibleAnalyticsAreas } from "./area-visibility";

describe("visible analytics areas", () => {
  it("applies only the valid areas chosen by the user", () => {
    expect(visibleAnalyticsAreas(["sales", "customers", "unknown", "sales"])).toEqual(["sales", "customers"]);
  });

  it("keeps a safe executive fallback when no valid preference is available", () => {
    expect(visibleAnalyticsAreas([])).toEqual(["executive"]);
  });
});
