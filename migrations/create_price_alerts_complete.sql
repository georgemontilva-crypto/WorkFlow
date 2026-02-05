-- Create or update price_alerts table with all required fields
CREATE TABLE IF NOT EXISTS `price_alerts` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `symbol` VARCHAR(20) NOT NULL,
  `type` ENUM('crypto', 'stock', 'forex', 'commodity') NOT NULL DEFAULT 'crypto',
  `target_price` DECIMAL(20, 8) NOT NULL,
  `condition` ENUM('above', 'below') NOT NULL,
  `is_active` INT NOT NULL DEFAULT 1,
  `notify_email` INT NOT NULL DEFAULT 1,
  `notify_app` INT NOT NULL DEFAULT 1,
  `triggered_at` TIMESTAMP NULL,
  `last_triggered_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_symbol` (`symbol`),
  INDEX `idx_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add missing columns if table already exists
ALTER TABLE `price_alerts` 
  ADD COLUMN IF NOT EXISTS `notify_email` INT NOT NULL DEFAULT 1 AFTER `is_active`,
  ADD COLUMN IF NOT EXISTS `notify_app` INT NOT NULL DEFAULT 1 AFTER `notify_email`,
  ADD COLUMN IF NOT EXISTS `triggered_at` TIMESTAMP NULL AFTER `notify_app`;
