CREATE TABLE `product_metric_snapshots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`sourceDatasetId` int NOT NULL,
	`productName` varchar(255) NOT NULL,
	`totalRevenue` int NOT NULL DEFAULT 0,
	`salesCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `product_metric_snapshots_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `product_metric_snapshots_organization_revenue_idx` ON `product_metric_snapshots` (`organizationId`,`totalRevenue`);