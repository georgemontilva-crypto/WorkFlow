-- Add recurring invoice fields to invoices table
-- Migration: add_recurring_invoice_fields
-- Date: 2026-01-25

ALTER TABLE `invoices` 
ADD COLUMN `is_recurring` INT NOT NULL DEFAULT 0,
ADD COLUMN `recurrence_frequency` ENUM('weekly', 'biweekly', 'monthly', 'quarterly', 'semiannually', 'annually'),
ADD COLUMN `recurrence_start_date` TIMESTAMP,
ADD COLUMN `recurrence_end_date` TIMESTAMP,
ADD COLUMN `last_generated_date` TIMESTAMP,
ADD COLUMN `parent_invoice_id` INT;

-- Add index for recurring invoices queries
CREATE INDEX `idx_invoices_recurring` ON `invoices` (`is_recurring`, `recurrence_frequency`);
CREATE INDEX `idx_invoices_parent` ON `invoices` (`parent_invoice_id`);
