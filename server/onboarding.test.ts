import { describe, expect, it } from "vitest";
import { normalizeOrganizationName, setupDataReadiness, setupGoals, setupSizes } from "./onboarding";

describe("onboarding helpers", () => {
  it("normalizes an organization name before it is persisted", () => {
    expect(normalizeOrganizationName("  Quantico    Angola  ")).toBe("Quantico Angola");
  });

  it("exposes fixed setup choices for the protected API", () => {
    expect(setupGoals).toContain("grow_revenue");
    expect(setupSizes).toContain("enterprise");
    expect(setupDataReadiness).toContain("spreadsheets");
  });
});
