import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { analyticalQueryAudits, InsertUser, organizationMembers, organizations, type User, users } from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values: InsertUser = { openId: user.openId, lastSignedIn: user.lastSignedIn ?? new Date() };
  const updateSet: Record<string, unknown> = { lastSignedIn: values.lastSignedIn };
  for (const field of ["name", "email", "loginMethod"] as const) {
    if (user[field] !== undefined) {
      values[field] = user[field] ?? null;
      updateSet[field] = user[field] ?? null;
    }
  }
  values.role = user.role ?? (user.openId === ENV.ownerOpenId ? "admin" : "user");
  updateSet.role = values.role;
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export type OrganizationContext = {
  id: number | null;
  name: string;
  industry: string;
  currency: string;
  membershipRole: "owner" | "admin" | "analyst" | "viewer" | "demo";
  isDemo: boolean;
};

const demoOrganization: OrganizationContext = {
  id: null,
  name: "Workspace de demonstração",
  industry: "Comércio",
  currency: "AOA",
  membershipRole: "demo",
  isDemo: true,
};

function organizationSlugFor(user: User) {
  const seed = (user.name || user.email || user.openId || "workspace").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  return `${seed.slice(0, 70) || "workspace"}-${user.id}`;
}

/** Returns only an organization that the authenticated user is a member of. */
export async function getCurrentOrganization(user?: User | null): Promise<OrganizationContext> {
  if (!user) return demoOrganization;
  const db = await getDb();
  if (!db) return { ...demoOrganization, name: user.name ? `${user.name} · Demonstração` : demoOrganization.name };

  const memberships = await db
    .select({ organization: organizations, membershipRole: organizationMembers.role })
    .from(organizationMembers)
    .innerJoin(organizations, eq(organizations.id, organizationMembers.organizationId))
    .where(eq(organizationMembers.userId, user.id))
    .limit(1);

  if (memberships[0]) {
    const { organization, membershipRole } = memberships[0];
    return { id: organization.id, name: organization.name, industry: organization.industry, currency: organization.currency, membershipRole, isDemo: false };
  }

  const name = user.name ? `${user.name} Intelligence` : "Nova organização";
  const [created] = await db.insert(organizations).values({ name, slug: organizationSlugFor(user) }).$returningId();
  if (!created) return demoOrganization;
  await db.insert(organizationMembers).values({ organizationId: created.id, userId: user.id, role: "owner" });
  return { id: created.id, name, industry: "general", currency: "AOA", membershipRole: "owner", isDemo: false };
}

export async function writeAnalyticalQueryAudit(input: {
  organizationId: number;
  userId: number;
  requestText: string;
  statement: string;
  status: "accepted" | "rejected";
  rejectionReason?: string;
}) {
  const db = await getDb();
  if (!db) return;
  await db.insert(analyticalQueryAudits).values(input);
}

/** Small helper kept for member-scoped reads used by future datasets and reports modules. */
export async function assertOrganizationMembership(userId: number, organizationId: number) {
  const db = await getDb();
  if (!db) return false;
  const memberships = await db.select({ id: organizationMembers.id }).from(organizationMembers).where(and(eq(organizationMembers.userId, userId), eq(organizationMembers.organizationId, organizationId))).limit(1);
  return Boolean(memberships[0]);
}
