import { desc, eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { executiveMetricSnapshots, organizationMembers, users } from "../drizzle/schema";
import type { TrpcContext } from "./_core/context";
import { getDb } from "./db";
import { appRouter } from "./routers";

describe("Ask Quantico com métricas conectadas", () => {
  it("produz resposta, comparação e visualização para uma organização com snapshots", async () => {
    const db = await getDb();
    if (!db) return;
    const [snapshot] = await db.select().from(executiveMetricSnapshots).orderBy(desc(executiveMetricSnapshots.createdAt)).limit(1);
    if (!snapshot) return;
    const [membership] = await db.select({ user: users }).from(organizationMembers).innerJoin(users, eq(organizationMembers.userId, users.id)).where(eq(organizationMembers.organizationId, snapshot.organizationId)).limit(1);
    if (!membership?.user) return;
    const caller = appRouter.createCaller({ user: membership.user, req: { headers: {} } as TrpcContext["req"], res: {} as TrpcContext["res"] });
    const result = await caller.ai.ask({ question: "Compare a receita dos períodos disponíveis e recomende a próxima ação." });
    expect(result.mode).toBe("connected");
    if (result.mode !== "connected") return;
    expect(result.answer.length).toBeGreaterThan(20);
    expect(result.comparison).toBeDefined();
    expect(result.visualization?.data.length).toBeGreaterThan(1);
  }, 45_000);
});
