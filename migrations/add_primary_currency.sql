-- Migration: Add primary_currency to user table
-- Date: 2026-01-24
-- Description: Add primary currency field for global currency management

-- Add primary_currency column
ALTER TABLE `user` 
ADD COLUMN `primary_currency` VARCHAR(3) NOT NULL DEFAULT 'USD' 
AFTER `two_factor_enabled`;

-- Update existing users to have USD as default
UPDATE `user` 
SET `primary_currency` = 'USD' 
WHERE `primary_currency` IS NULL OR `primary_currency` = '';

-- Verify migration
SELECT id, name, email, primary_currency 
FROM `user` 
LIMIT 10;
