import { desc, eq } from "drizzle-orm";
import { productMetricSnapshots } from "../drizzle/schema";
import { getDb } from "./db";

/** Returns only organisation-scoped aggregate product metrics, never raw dataset rows. */
export async function getTopProducts(organizationId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({ productName: productMetricSnapshots.productName, totalRevenue: productMetricSnapshots.totalRevenue, salesCount: productMetricSnapshots.salesCount }).from(productMetricSnapshots).where(eq(productMetricSnapshots.organizationId, organizationId)).orderBy(desc(productMetricSnapshots.totalRevenue)).limit(10);
}
