CREATE TABLE `analytical_query_audits` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`userId` int NOT NULL,
	`requestText` text NOT NULL,
	`statement` text NOT NULL,
	`status` enum('accepted','rejected') NOT NULL,
	`rejectionReason` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `analytical_query_audits_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `data_sources` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`name` varchar(160) NOT NULL,
	`type` varchar(32) NOT NULL,
	`status` enum('pending','connected','error','paused') NOT NULL DEFAULT 'pending',
	`healthScore` int NOT NULL DEFAULT 0,
	`lastSyncedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `data_sources_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `imported_datasets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`dataSourceId` int,
	`fileName` varchar(255) NOT NULL,
	`fileKey` varchar(512) NOT NULL,
	`contentType` varchar(100) NOT NULL,
	`rowCount` int NOT NULL DEFAULT 0,
	`qualityScore` int NOT NULL DEFAULT 0,
	`profile` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `imported_datasets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `organization_members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`userId` int NOT NULL,
	`role` enum('owner','admin','analyst','viewer') NOT NULL DEFAULT 'viewer',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `organization_members_id` PRIMARY KEY(`id`),
	CONSTRAINT `organization_members_organization_user_unique` UNIQUE(`organizationId`,`userId`)
);
--> statement-breakpoint
CREATE TABLE `organizations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(160) NOT NULL,
	`slug` varchar(96) NOT NULL,
	`industry` varchar(64) NOT NULL DEFAULT 'general',
	`currency` varchar(3) NOT NULL DEFAULT 'AOA',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `organizations_id` PRIMARY KEY(`id`),
	CONSTRAINT `organizations_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`name` varchar(160) NOT NULL,
	`category` enum('executive','financial','commercial') NOT NULL,
	`cadence` enum('daily','weekly','monthly','manual') NOT NULL DEFAULT 'manual',
	`configuration` json,
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `reports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `analytical_query_audits_organization_created_idx` ON `analytical_query_audits` (`organizationId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `data_sources_organization_idx` ON `data_sources` (`organizationId`);--> statement-breakpoint
CREATE INDEX `imported_datasets_organization_idx` ON `imported_datasets` (`organizationId`);--> statement-breakpoint
CREATE INDEX `organization_members_user_idx` ON `organization_members` (`userId`);--> statement-breakpoint
CREATE INDEX `reports_organization_idx` ON `reports` (`organizationId`);