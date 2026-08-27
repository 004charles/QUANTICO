import { desc, eq } from "drizzle-orm";
import { organizationMembers, userWorkspacePreferences, users } from "../drizzle/schema";
import { getDb, type OrganizationContext } from "./db";

export const workspaceAreas = ["executive", "sales", "customers", "operations"] as const;
export type WorkspaceArea = (typeof workspaceAreas)[number];
export type MembershipRole = Exclude<OrganizationContext["membershipRole"], "demo">;

export function canManageWorkspace(role: OrganizationContext["membershipRole"]) { return role === "owner" || role === "admin"; }
export function canManageData(role: OrganizationContext["membershipRole"]) { return role === "owner" || role === "admin" || role === "analyst"; }
export function canManageReports(role: OrganizationContext["membershipRole"]) { return canManageData(role); }
export function requireWorkspaceRole(role: OrganizationContext["membershipRole"], action: string, allowed: readonly MembershipRole[]) {
  if (!allowed.includes(role as MembershipRole)) throw new Error(`Não tem permissão para ${action} nesta organização.`);
}

function normalizeAreas(areas: WorkspaceArea[]) {
  const unique = Array.from(new Set(areas.filter((area) => workspaceAreas.includes(area))));
  return unique.length ? unique : ["executive"];
}

export async function getWorkspacePreferences(organizationId: number, userId: number) {
  const db = await getDb();
  if (!db) return { defaultArea: "executive" as WorkspaceArea, visibleAreas: workspaceAreas };
  const existing = (await db.select().from(userWorkspacePreferences).where(eq(userWorkspacePreferences.organizationId, organizationId)).limit(20)).find((item) => item.userId === userId);
  if (!existing) return { defaultArea: "executive" as WorkspaceArea, visibleAreas: workspaceAreas };
  return { defaultArea: workspaceAreas.includes(existing.defaultArea as WorkspaceArea) ? existing.defaultArea as WorkspaceArea : "executive" as WorkspaceArea, visibleAreas: normalizeAreas(existing.visibleAreas as WorkspaceArea[]) };
}

export async function saveWorkspacePreferences(input: { organizationId: number; userId: number; defaultArea: WorkspaceArea; visibleAreas: WorkspaceArea[] }) {
  const db = await getDb();
  if (!db) throw new Error("A base de dados não está disponível para guardar as preferências.");
  const visibleAreas = normalizeAreas(input.visibleAreas);
  const defaultArea = visibleAreas.includes(input.defaultArea) ? input.defaultArea : visibleAreas[0];
  await db.insert(userWorkspacePreferences).values({ organizationId: input.organizationId, userId: input.userId, defaultArea, visibleAreas }).onDuplicateKeyUpdate({ set: { defaultArea, visibleAreas } });
  return { defaultArea, visibleAreas };
}

export async function listOrganizationMembers(organizationId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({ userId: users.id, name: users.name, email: users.email, role: organizationMembers.role, joinedAt: organizationMembers.createdAt }).from(organizationMembers).innerJoin(users, eq(users.id, organizationMembers.userId)).where(eq(organizationMembers.organizationId, organizationId)).orderBy(desc(organizationMembers.createdAt));
}
