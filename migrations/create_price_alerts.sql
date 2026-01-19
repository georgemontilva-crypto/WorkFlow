-- Create price_alerts table
CREATE TABLE IF NOT EXISTS `price_alerts` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `symbol` VARCHAR(20) NOT NULL,
  `type` ENUM('crypto', 'stock', 'forex', 'commodity') NOT NULL,
  `target_price` DECIMAL(20, 8) NOT NULL,
  `condition` ENUM('above', 'below') NOT NULL,
  `is_active` INT NOT NULL DEFAULT 1,
  `last_triggered_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_symbol` (`symbol`),
  INDEX `idx_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
