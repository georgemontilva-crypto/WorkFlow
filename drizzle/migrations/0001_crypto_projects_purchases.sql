-- Create crypto_projects table
CREATE TABLE IF NOT EXISTS `crypto_projects` (
  `id` serial AUTO_INCREMENT NOT NULL,
  `user_id` int NOT NULL,
  `symbol` varchar(20) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `crypto_projects_id` PRIMARY KEY(`id`)
);

-- Create index on user_id and symbol
CREATE INDEX IF NOT EXISTS `idx_user_symbol` ON `crypto_projects` (`user_id`, `symbol`);

-- Create crypto_purchases table
CREATE TABLE IF NOT EXISTS `crypto_purchases` (
  `id` serial AUTO_INCREMENT NOT NULL,
  `project_id` int NOT NULL,
  `quantity` decimal(20,8) NOT NULL,
  `buy_price` decimal(20,8) NOT NULL,
  `currency` varchar(3) NOT NULL DEFAULT 'USD',
  `created_at` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `crypto_purchases_id` PRIMARY KEY(`id`)
);

-- Create index on project_id
CREATE INDEX IF NOT EXISTS `idx_project` ON `crypto_purchases` (`project_id`);
