import { eq } from "drizzle-orm";
import { organizationProfiles, organizations } from "../drizzle/schema";
import { getDb } from "./db";

export const setupGoals = ["grow_revenue", "improve_retention", "improve_efficiency", "improve_forecast"] as const;
export const setupSizes = ["solo", "small", "mid_market", "enterprise"] as const;
export const setupDataReadiness = ["starting", "spreadsheets", "systems_connected"] as const;

export type OrganizationSetupInput = {
  organizationId: number;
  organizationName: string;
  industry: string;
  companySize: (typeof setupSizes)[number];
  primaryGoal: (typeof setupGoals)[number];
  dataReadiness: (typeof setupDataReadiness)[number];
};

export function normalizeOrganizationName(value: string) {
  return value.trim().replace(/\s+/g, " ").slice(0, 160);
}

export async function getOrganizationSetup(organizationId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(organizationProfiles).where(eq(organizationProfiles.organizationId, organizationId)).limit(1);
  return result[0] ?? null;
}

/** Persists only the authenticated member's current organization configuration. */
export async function saveOrganizationSetup(input: OrganizationSetupInput) {
  const db = await getDb();
  if (!db) throw new Error("A configuração da organização não está disponível neste momento.");
  const organizationName = normalizeOrganizationName(input.organizationName);
  await db.update(organizations).set({ name: organizationName, industry: input.industry }).where(eq(organizations.id, input.organizationId));
  await db.insert(organizationProfiles).values({
    organizationId: input.organizationId,
    companySize: input.companySize,
    primaryGoal: input.primaryGoal,
    dataReadiness: input.dataReadiness,
    onboardingComplete: 1,
    completedAt: new Date(),
  }).onDuplicateKeyUpdate({ set: {
    companySize: input.companySize,
    primaryGoal: input.primaryGoal,
    dataReadiness: input.dataReadiness,
    onboardingComplete: 1,
    completedAt: new Date(),
  } });
  return getOrganizationSetup(input.organizationId);
}
