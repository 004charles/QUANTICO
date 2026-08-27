import { index, int, json, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const organizations = mysqlTable("organizations", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  slug: varchar("slug", { length: 96 }).notNull(),
  industry: varchar("industry", { length: 64 }).default("general").notNull(),
  currency: varchar("currency", { length: 3 }).default("AOA").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [uniqueIndex("organizations_slug_unique").on(table.slug)]);

export const organizationMembers = mysqlTable("organization_members", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  userId: int("userId").notNull(),
  role: mysqlEnum("role", ["owner", "admin", "analyst", "viewer"]).default("viewer").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("organization_members_organization_user_unique").on(table.organizationId, table.userId),
  index("organization_members_user_idx").on(table.userId),
]);

export const dataSources = mysqlTable("data_sources", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  name: varchar("name", { length: 160 }).notNull(),
  type: varchar("type", { length: 32 }).notNull(),
  status: mysqlEnum("status", ["pending", "connected", "error", "paused"]).default("pending").notNull(),
  healthScore: int("healthScore").default(0).notNull(),
  lastSyncedAt: timestamp("lastSyncedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [index("data_sources_organization_idx").on(table.organizationId)]);

export const importedDatasets = mysqlTable("imported_datasets", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  dataSourceId: int("dataSourceId"),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  fileKey: varchar("fileKey", { length: 512 }).notNull(),
  contentType: varchar("contentType", { length: 100 }).notNull(),
  rowCount: int("rowCount").default(0).notNull(),
  qualityScore: int("qualityScore").default(0).notNull(),
  profile: json("profile"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [index("imported_datasets_organization_idx").on(table.organizationId)]);

export const executiveMetricSnapshots = mysqlTable("executive_metric_snapshots", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  metricDate: timestamp("metricDate").notNull(),
  totalRevenue: int("totalRevenue").default(0).notNull(),
  salesCount: int("salesCount").default(0).notNull(),
  averageTicket: int("averageTicket").default(0).notNull(),
  activeCustomers: int("activeCustomers").default(0).notNull(),
  retainedCustomers: int("retainedCustomers").default(0).notNull(),
  forecastRevenue: int("forecastRevenue").default(0).notNull(),
  confidence: int("confidence").default(0).notNull(),
  pipelineValue: int("pipelineValue").default(0).notNull(),
  conversionRate: int("conversionRate").default(0).notNull(),
  retentionRate: int("retentionRate").default(0).notNull(),
  churnRiskCount: int("churnRiskCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [index("executive_metric_snapshots_organization_date_idx").on(table.organizationId, table.metricDate)]);

export const analyticalQueryAudits = mysqlTable("analytical_query_audits", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  userId: int("userId").notNull(),
  requestText: text("requestText").notNull(),
  statement: text("statement").notNull(),
  status: mysqlEnum("status", ["accepted", "rejected"]).notNull(),
  rejectionReason: varchar("rejectionReason", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [index("analytical_query_audits_organization_created_idx").on(table.organizationId, table.createdAt)]);

export const reports = mysqlTable("reports", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  name: varchar("name", { length: 160 }).notNull(),
  category: mysqlEnum("category", ["executive", "financial", "commercial"]).notNull(),
  cadence: mysqlEnum("cadence", ["daily", "weekly", "monthly", "manual"]).default("manual").notNull(),
  configuration: json("configuration"),
  isActive: int("isActive").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [index("reports_organization_idx").on(table.organizationId)]);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Organization = typeof organizations.$inferSelect;
export type OrganizationMember = typeof organizationMembers.$inferSelect;
