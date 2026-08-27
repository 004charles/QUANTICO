ALTER TABLE `reports` ADD `scheduleCronTaskUid` varchar(65);--> statement-breakpoint
ALTER TABLE `reports` ADD `lastGeneratedAt` timestamp;--> statement-breakpoint
CREATE INDEX `reports_schedule_cron_task_uid_idx` ON `reports` (`scheduleCronTaskUid`);