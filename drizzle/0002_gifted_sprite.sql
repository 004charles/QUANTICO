CREATE TABLE `executive_metric_snapshots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`metricDate` timestamp NOT NULL,
	`totalRevenue` int NOT NULL DEFAULT 0,
	`salesCount` int NOT NULL DEFAULT 0,
	`averageTicket` int NOT NULL DEFAULT 0,
	`activeCustomers` int NOT NULL DEFAULT 0,
	`retainedCustomers` int NOT NULL DEFAULT 0,
	`forecastRevenue` int NOT NULL DEFAULT 0,
	`confidence` int NOT NULL DEFAULT 0,
	`pipelineValue` int NOT NULL DEFAULT 0,
	`conversionRate` int NOT NULL DEFAULT 0,
	`retentionRate` int NOT NULL DEFAULT 0,
	`churnRiskCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `executive_metric_snapshots_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `executive_metric_snapshots_organization_date_idx` ON `executive_metric_snapshots` (`organizationId`,`metricDate`);