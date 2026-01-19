CREATE TABLE `clients` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(320) NOT NULL,
	`phone` varchar(50) NOT NULL,
	`company` varchar(255),
	`billing_cycle` enum('monthly','quarterly','yearly','custom') NOT NULL,
	`custom_cycle_days` int,
	`amount` decimal(10,2) NOT NULL,
	`next_payment_date` timestamp NOT NULL,
	`reminder_days` int NOT NULL DEFAULT 7,
	`status` enum('active','inactive','overdue') NOT NULL DEFAULT 'active',
	`archived` boolean NOT NULL DEFAULT false,
	`notes` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `clients_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `invoices` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`client_id` int NOT NULL,
	`invoice_number` varchar(50) NOT NULL,
	`issue_date` timestamp NOT NULL,
	`due_date` timestamp NOT NULL,
	`items` text NOT NULL,
	`subtotal` decimal(10,2) NOT NULL,
	`tax` decimal(10,2) NOT NULL DEFAULT '0',
	`total` decimal(10,2) NOT NULL,
	`status` enum('draft','sent','paid','overdue','cancelled') NOT NULL DEFAULT 'draft',
	`notes` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `invoices_id` PRIMARY KEY(`id`),
	CONSTRAINT `invoices_invoice_number_unique` UNIQUE(`invoice_number`)
);
--> statement-breakpoint
CREATE TABLE `savings_goals` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`target_amount` decimal(10,2) NOT NULL,
	`current_amount` decimal(10,2) NOT NULL DEFAULT '0',
	`target_date` timestamp,
	`status` enum('active','completed','cancelled') NOT NULL DEFAULT 'active',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `savings_goals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `support_messages` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`ticket_id` int NOT NULL,
	`user_id` int NOT NULL,
	`message` text NOT NULL,
	`is_staff` boolean NOT NULL DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `support_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `support_tickets` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`subject` text NOT NULL,
	`status` enum('open','in_progress','resolved','closed') NOT NULL DEFAULT 'open',
	`priority` enum('low','medium','high','urgent') NOT NULL DEFAULT 'medium',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `support_tickets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`type` enum('income','expense') NOT NULL,
	`category` enum('salary','freelance','investment','other_income','rent','utilities','food','transportation','healthcare','entertainment','other_expense') NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`description` text NOT NULL,
	`date` timestamp NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`name` text NOT NULL,
	`email` varchar(320) NOT NULL,
	`password_hash` varchar(255) NOT NULL,
	`email_verified` int NOT NULL DEFAULT 0,
	`login_method` enum('email','oauth') NOT NULL DEFAULT 'email',
	`role` enum('user','admin','super_admin') NOT NULL DEFAULT 'user',
	`trial_ends_at` timestamp,
	`has_lifetime_access` int NOT NULL DEFAULT 0,
	`stripe_customer_id` varchar(255),
	`stripe_payment_id` varchar(255),
	`two_factor_secret` varchar(255),
	`two_factor_enabled` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	`last_signed_in` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_email_unique` UNIQUE(`email`)
);
