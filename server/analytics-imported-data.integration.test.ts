import { desc } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { executiveMetricSnapshots } from "../drizzle/schema";
import { readApprovedMetric } from "./analytics-read-model";
import { getDb } from "./db";

describe("executor analítico com fonte importada", () => {
  it("retorna dados prontos para o tenant que possui snapshots", async () => {
    const db = await getDb();
    if (!db) return;
    const [snapshot] = await db.select().from(executiveMetricSnapshots).orderBy(desc(executiveMetricSnapshots.createdAt)).limit(1);
    if (!snapshot) return;
    const result = await readApprovedMetric("revenue", snapshot.organizationId);
    expect(result.state).toBe("ready");
    expect(result.points.some((point) => point.value === snapshot.totalRevenue)).toBe(true);
  });
});
