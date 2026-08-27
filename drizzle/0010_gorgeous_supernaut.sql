CREATE TABLE `action_follow_ups` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`actionId` int NOT NULL,
	`createdByUserId` int NOT NULL,
	`note` text NOT NULL,
	`progress` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `action_follow_ups_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `alert_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`alertRuleId` int NOT NULL,
	`alertType` varchar(32) NOT NULL,
	`title` varchar(200) NOT NULL,
	`message` text NOT NULL,
	`currentValue` int NOT NULL DEFAULT 0,
	`threshold` int NOT NULL DEFAULT 0,
	`severity` varchar(16) NOT NULL DEFAULT 'medium',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `alert_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `growth_actions` ADD `assigneeName` varchar(160);--> statement-breakpoint
ALTER TABLE `growth_actions` ADD `actualRevenue` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `growth_actions` ADD `progress` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `growth_actions` ADD `resultNotes` text;--> statement-breakpoint
ALTER TABLE `growth_actions` ADD `completedAt` timestamp;--> statement-breakpoint
CREATE INDEX `action_follow_ups_organization_action_idx` ON `action_follow_ups` (`organizationId`,`actionId`);--> statement-breakpoint
CREATE INDEX `alert_events_organization_created_idx` ON `alert_events` (`organizationId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `alert_events_rule_created_idx` ON `alert_events` (`alertRuleId`,`createdAt`);