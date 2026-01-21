CREATE TABLE `company_profiles` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`company_name` varchar(255) NOT NULL,
	`logo_url` text,
	`email` varchar(320) NOT NULL,
	`phone` varchar(50),
	`website` varchar(255),
	`address` text,
	`city` varchar(100),
	`state` varchar(100),
	`postal_code` varchar(20),
	`country` varchar(100),
	`tax_id` varchar(100),
	`bank_name` varchar(255),
	`bank_account` varchar(100),
	`bank_routing` varchar(100),
	`payment_instructions` text,
	`invoice_footer` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `company_profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `company_profiles_user_id_unique` UNIQUE(`user_id`)
);
--> statement-breakpoint
CREATE TABLE `dashboard_widgets` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`widget_type` varchar(50) NOT NULL,
	`widget_data` text,
	`position` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `dashboard_widgets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `verification_tokens` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`token` varchar(255) NOT NULL,
	`expires_at` timestamp NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `verification_tokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `verification_tokens_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
ALTER TABLE `invoices` MODIFY COLUMN `status` enum('draft','sent','payment_sent','paid','overdue','cancelled') NOT NULL DEFAULT 'draft';--> statement-breakpoint
ALTER TABLE `support_tickets` MODIFY COLUMN `status` enum('open','in_progress','waiting_user','waiting_agent','resolved','closed') NOT NULL DEFAULT 'open';--> statement-breakpoint
ALTER TABLE `clients` ADD `currency` varchar(3) DEFAULT 'USD' NOT NULL;--> statement-breakpoint
ALTER TABLE `invoices` ADD `currency` varchar(3) DEFAULT 'USD' NOT NULL;--> statement-breakpoint
ALTER TABLE `invoices` ADD `payment_token` varchar(64);--> statement-breakpoint
ALTER TABLE `invoices` ADD `payment_link` text;--> statement-breakpoint
ALTER TABLE `invoices` ADD `client_comment` text;--> statement-breakpoint
ALTER TABLE `invoices` ADD `is_recurring` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `invoices` ADD `recurrence_frequency` enum('every_minute','monthly','biweekly','annual','custom');--> statement-breakpoint
ALTER TABLE `invoices` ADD `recurrence_interval` int;--> statement-breakpoint
ALTER TABLE `invoices` ADD `next_generation_date` timestamp;--> statement-breakpoint
ALTER TABLE `invoices` ADD `parent_invoice_id` int;--> statement-breakpoint
ALTER TABLE `market_favorites` ADD `position` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `savings_goals` ADD `currency` varchar(3) DEFAULT 'USD' NOT NULL;--> statement-breakpoint
ALTER TABLE `support_messages` ADD `sender_id` int NOT NULL;--> statement-breakpoint
ALTER TABLE `support_messages` ADD `sender_type` enum('user','agent','ai') DEFAULT 'user' NOT NULL;--> statement-breakpoint
ALTER TABLE `support_messages` ADD `is_read` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `support_tickets` ADD `assigned_to` int;--> statement-breakpoint
ALTER TABLE `support_tickets` ADD `has_unread_user` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `support_tickets` ADD `has_unread_agent` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `support_tickets` ADD `resolved_at` timestamp;--> statement-breakpoint
ALTER TABLE `support_tickets` ADD `closed_at` timestamp;--> statement-breakpoint
ALTER TABLE `transactions` ADD `currency` varchar(3) DEFAULT 'USD' NOT NULL;--> statement-breakpoint
ALTER TABLE `user` ADD `subscription_plan` enum('free','pro','business') DEFAULT 'free' NOT NULL;--> statement-breakpoint
ALTER TABLE `user` ADD `subscription_status` enum('active','cancelled','past_due','trialing') DEFAULT 'active';--> statement-breakpoint
ALTER TABLE `user` ADD `subscription_ends_at` timestamp;--> statement-breakpoint
ALTER TABLE `user` ADD `stripe_subscription_id` varchar(255);--> statement-breakpoint
ALTER TABLE `invoices` ADD CONSTRAINT `invoices_payment_token_unique` UNIQUE(`payment_token`);--> statement-breakpoint
ALTER TABLE `support_messages` DROP COLUMN `user_id`;--> statement-breakpoint
ALTER TABLE `support_messages` DROP COLUMN `is_staff`;