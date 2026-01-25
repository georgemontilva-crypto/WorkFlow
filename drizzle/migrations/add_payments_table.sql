-- Add payments table for manual payment registration
-- Migration: add_payments_table
-- Date: 2026-01-25

CREATE TABLE IF NOT EXISTS `payments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `invoice_id` INT NOT NULL,
  `amount` DECIMAL(10, 2) NOT NULL,
  `payment_date` TIMESTAMP NOT NULL,
  `method` ENUM('cash', 'transfer', 'card', 'other') NOT NULL,
  `reference` VARCHAR(255),
  `notes` TEXT,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  INDEX `idx_payments_user` (`user_id`),
  INDEX `idx_payments_invoice` (`invoice_id`),
  INDEX `idx_payments_date` (`payment_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add 'partial' status to invoices enum
ALTER TABLE `invoices` 
MODIFY COLUMN `status` ENUM('draft', 'sent', 'paid', 'partial', 'cancelled') NOT NULL DEFAULT 'draft';
