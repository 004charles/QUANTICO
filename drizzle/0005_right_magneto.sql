CREATE TABLE `organization_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`companySize` varchar(32) NOT NULL DEFAULT 'not_defined',
	`primaryGoal` varchar(64) NOT NULL DEFAULT 'grow_revenue',
	`dataReadiness` varchar(32) NOT NULL DEFAULT 'starting',
	`onboardingComplete` int NOT NULL DEFAULT 0,
	`completedAt` timestamp,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `organization_profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `organization_profiles_organization_unique` UNIQUE(`organizationId`)
);
