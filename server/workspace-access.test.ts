import { describe, expect, it } from "vitest";
import { canManageData, canManageReports, canManageWorkspace, requireWorkspaceRole } from "./workspace-access";

describe("workspace access rules", () => {
  it("assigns management privileges only to the appropriate membership roles", () => {
    expect(canManageWorkspace("owner")).toBe(true);
    expect(canManageWorkspace("analyst")).toBe(false);
    expect(canManageData("analyst")).toBe(true);
    expect(canManageReports("viewer")).toBe(false);
  });

  it("blocks a viewer from administrative actions on the server", () => {
    expect(() => requireWorkspaceRole("viewer", "alterar as configurações", ["owner", "admin"])).toThrow("Não tem permissão");
  });
});
