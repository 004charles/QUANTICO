CREATE TABLE `user_workspace_preferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`userId` int NOT NULL,
	`defaultArea` varchar(32) NOT NULL DEFAULT 'executive',
	`visibleAreas` json NOT NULL,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_workspace_preferences_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_workspace_preferences_organization_user_unique` UNIQUE(`organizationId`,`userId`)
);
--> statement-breakpoint
CREATE INDEX `user_workspace_preferences_organization_idx` ON `user_workspace_preferences` (`organizationId`);