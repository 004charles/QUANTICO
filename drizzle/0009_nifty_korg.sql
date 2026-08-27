CREATE TABLE `alert_rules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`createdByUserId` int NOT NULL,
	`name` varchar(160) NOT NULL,
	`alertType` varchar(32) NOT NULL,
	`threshold` int NOT NULL DEFAULT 0,
	`isActive` int NOT NULL DEFAULT 1,
	`lastTriggeredAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `alert_rules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `growth_actions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`createdByUserId` int NOT NULL,
	`title` varchar(180) NOT NULL,
	`actionType` varchar(32) NOT NULL,
	`segment` varchar(160) NOT NULL,
	`estimatedRevenue` int NOT NULL DEFAULT 0,
	`status` varchar(24) NOT NULL DEFAULT 'draft',
	`dueDate` timestamp,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `growth_actions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `alert_rules_organization_active_idx` ON `alert_rules` (`organizationId`,`isActive`);--> statement-breakpoint
CREATE INDEX `growth_actions_organization_status_idx` ON `growth_actions` (`organizationId`,`status`);