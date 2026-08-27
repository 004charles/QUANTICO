CREATE TABLE `dataset_field_mappings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`datasetId` int NOT NULL,
	`mapping` json NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `dataset_field_mappings_id` PRIMARY KEY(`id`),
	CONSTRAINT `dataset_field_mappings_dataset_unique` UNIQUE(`datasetId`)
);
--> statement-breakpoint
ALTER TABLE `data_sources` ADD `connectionConfig` json;--> statement-breakpoint
ALTER TABLE `data_sources` ADD `credentialCiphertext` text;--> statement-breakpoint
ALTER TABLE `executive_metric_snapshots` ADD `sourceDatasetId` int;--> statement-breakpoint
CREATE INDEX `dataset_field_mappings_organization_idx` ON `dataset_field_mappings` (`organizationId`);