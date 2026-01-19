CREATE TABLE `market_favorites` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`symbol` varchar(20) NOT NULL,
	`type` enum('crypto','stock','forex','commodity') NOT NULL,
	`is_dashboard_widget` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `market_favorites_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `password_reset_tokens` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`token` varchar(255) NOT NULL,
	`expires_at` timestamp NOT NULL,
	`used` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `password_reset_tokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `password_reset_tokens_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `price_alerts` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`symbol` varchar(20) NOT NULL,
	`type` enum('crypto','stock','forex','commodity') NOT NULL,
	`target_price` decimal(20,8) NOT NULL,
	`condition` enum('above','below') NOT NULL,
	`is_active` int NOT NULL DEFAULT 1,
	`last_triggered_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `price_alerts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `support_messages` MODIFY COLUMN `is_staff` int NOT NULL;--> statement-breakpoint
ALTER TABLE `support_messages` MODIFY COLUMN `is_staff` int NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE `invoices` ADD `paid_amount` decimal(10,2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE `invoices` ADD `balance` decimal(10,2) NOT NULL;