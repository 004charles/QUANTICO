import { describe, expect, it } from "vitest";
import { enforceTenantScope, TenantScopeError } from "./tenant-scope";

describe("enforceTenantScope", () => {
  it("returns a resource only inside the active organization boundary", () => {
    expect(enforceTenantScope({ id: 18, organizationId: 12, name: "Receita mensal" }, 12)).toEqual({
      id: 18,
      organizationId: 12,
      name: "Receita mensal",
    });
  });

  it("rejects a record from a different organization", () => {
    expect(() => enforceTenantScope({ id: 19, organizationId: 13 }, 12)).toThrow(TenantScopeError);
  });

  it("preserves a not-found result without revealing a resource", () => {
    expect(enforceTenantScope(undefined, 12)).toBeUndefined();
  });
});
