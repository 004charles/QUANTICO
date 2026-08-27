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

export const organizationProfiles = mysqlTable("organization_profiles", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  companySize: varchar("companySize", { length: 32 }).default("not_defined").notNull(),
  primaryGoal: varchar("primaryGoal", { length: 64 }).default("grow_revenue").notNull(),
  dataReadiness: varchar("dataReadiness", { length: 32 }).default("starting").notNull(),
  onboardingComplete: int("onboardingComplete").default(0).notNull(),
  completedAt: timestamp("completedAt"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [uniqueIndex("organization_profiles_organization_unique").on(table.organizationId)]);

export const userWorkspacePreferences = mysqlTable("user_workspace_preferences", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  userId: int("userId").notNull(),
  defaultArea: varchar("defaultArea", { length: 32 }).default("executive").notNull(),
  visibleAreas: json("visibleAreas").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  uniqueIndex("user_workspace_preferences_organization_user_unique").on(table.organizationId, table.userId),
  index("user_workspace_preferences_organization_idx").on(table.organizationId),
]);

export const dataSources = mysqlTable("data_sources", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  name: varchar("name", { length: 160 }).notNull(),
  type: varchar("type", { length: 32 }).notNull(),
  connectionConfig: json("connectionConfig"),
  credentialCiphertext: text("credentialCiphertext"),
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

export const datasetFieldMappings = mysqlTable("dataset_field_mappings", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  datasetId: int("datasetId").notNull(),
  mapping: json("mapping").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  uniqueIndex("dataset_field_mappings_dataset_unique").on(table.datasetId),
  index("dataset_field_mappings_organization_idx").on(table.organizationId),
]);

export const executiveMetricSnapshots = mysqlTable("executive_metric_snapshots", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  sourceDatasetId: int("sourceDatasetId"),
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

export const productMetricSnapshots = mysqlTable("product_metric_snapshots", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  sourceDatasetId: int("sourceDatasetId").notNull(),
  productName: varchar("productName", { length: 255 }).notNull(),
  totalRevenue: int("totalRevenue").default(0).notNull(),
  salesCount: int("salesCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [index("product_metric_snapshots_organization_revenue_idx").on(table.organizationId, table.totalRevenue)]);

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

export const growthActions = mysqlTable("growth_actions", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  createdByUserId: int("createdByUserId").notNull(),
  title: varchar("title", { length: 180 }).notNull(),
  actionType: varchar("actionType", { length: 32 }).notNull(),
  segment: varchar("segment", { length: 160 }).notNull(),
  sourceSignal: varchar("sourceSignal", { length: 200 }),
  assigneeName: varchar("assigneeName", { length: 160 }),
  estimatedRevenue: int("estimatedRevenue").default(0).notNull(),
  actualRevenue: int("actualRevenue").default(0).notNull(),
  progress: int("progress").default(0).notNull(),
  status: varchar("status", { length: 24 }).default("draft").notNull(),
  dueDate: timestamp("dueDate"),
  notes: text("notes"),
  resultNotes: text("resultNotes"),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [index("growth_actions_organization_status_idx").on(table.organizationId, table.status)]);

export const actionFollowUps = mysqlTable("action_follow_ups", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  actionId: int("actionId").notNull(),
  createdByUserId: int("createdByUserId").notNull(),
  note: text("note").notNull(),
  progress: int("progress").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [index("action_follow_ups_organization_action_idx").on(table.organizationId, table.actionId)]);

export const alertRules = mysqlTable("alert_rules", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  createdByUserId: int("createdByUserId").notNull(),
  name: varchar("name", { length: 160 }).notNull(),
  alertType: varchar("alertType", { length: 32 }).notNull(),
  threshold: int("threshold").default(0).notNull(),
  isActive: int("isActive").default(1).notNull(),
  lastTriggeredAt: timestamp("lastTriggeredAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [index("alert_rules_organization_active_idx").on(table.organizationId, table.isActive)]);

export const alertEvents = mysqlTable("alert_events", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  alertRuleId: int("alertRuleId").notNull(),
  alertType: varchar("alertType", { length: 32 }).notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  message: text("message").notNull(),
  currentValue: int("currentValue").default(0).notNull(),
  threshold: int("threshold").default(0).notNull(),
  severity: varchar("severity", { length: 16 }).default("medium").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [index("alert_events_organization_created_idx").on(table.organizationId, table.createdAt), index("alert_events_rule_created_idx").on(table.alertRuleId, table.createdAt)]);

export const reports = mysqlTable("reports", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  name: varchar("name", { length: 160 }).notNull(),
  category: mysqlEnum("category", ["executive", "financial", "commercial"]).notNull(),
  cadence: mysqlEnum("cadence", ["daily", "weekly", "monthly", "manual"]).default("manual").notNull(),
  configuration: json("configuration"),
  scheduleCronTaskUid: varchar("scheduleCronTaskUid", { length: 65 }),
  lastGeneratedAt: timestamp("lastGeneratedAt"),
  isActive: int("isActive").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [index("reports_organization_idx").on(table.organizationId), index("reports_schedule_cron_task_uid_idx").on(table.scheduleCronTaskUid)]);

export const reportArtifacts = mysqlTable("report_artifacts", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  reportId: int("reportId").notNull(),
  fileKey: varchar("fileKey", { length: 512 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [index("report_artifacts_organization_report_idx").on(table.organizationId, table.reportId)]);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Organization = typeof organizations.$inferSelect;
export type OrganizationMember = typeof organizationMembers.$inferSelect;
