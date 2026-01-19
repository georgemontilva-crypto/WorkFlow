-- Add currency field to savings_goals table
ALTER TABLE `savings_goals` 
ADD COLUMN `currency` VARCHAR(3) NOT NULL DEFAULT 'USD' AFTER `current_amount`;

-- Add currency field to transactions table
ALTER TABLE `transactions` 
ADD COLUMN `currency` VARCHAR(3) NOT NULL DEFAULT 'USD' AFTER `amount`;

-- Add currency field to invoices table
ALTER TABLE `invoices` 
ADD COLUMN `currency` VARCHAR(3) NOT NULL DEFAULT 'USD' AFTER `total_amount`;

-- Add currency field to clients table (for billing_amount reference)
ALTER TABLE `clients` 
ADD COLUMN `currency` VARCHAR(3) NOT NULL DEFAULT 'USD' AFTER `next_payment_date`;

-- Add index for currency fields for better query performance
CREATE INDEX `idx_savings_goals_currency` ON `savings_goals` (`currency`);
CREATE INDEX `idx_transactions_currency` ON `transactions` (`currency`);
CREATE INDEX `idx_invoices_currency` ON `invoices` (`currency`);
CREATE INDEX `idx_clients_currency` ON `clients` (`currency`);
