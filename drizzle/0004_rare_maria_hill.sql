CREATE TABLE `report_artifacts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`reportId` int NOT NULL,
	`fileKey` varchar(512) NOT NULL,
	`title` varchar(255) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `report_artifacts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `report_artifacts_organization_report_idx` ON `report_artifacts` (`organizationId`,`reportId`);