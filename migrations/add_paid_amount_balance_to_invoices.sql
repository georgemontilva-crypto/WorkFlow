-- Migration: Add paid_amount and balance fields to invoices table
-- Date: 2026-01-19
-- Description: Adds support for partial payments tracking in invoices

ALTER TABLE `invoices` 
ADD COLUMN `paid_amount` decimal(10,2) NOT NULL DEFAULT '0' AFTER `total`,
ADD COLUMN `balance` decimal(10,2) NOT NULL AFTER `paid_amount`;

-- Update existing invoices to set balance equal to total (no payments made yet)
UPDATE `invoices` SET `balance` = `total` WHERE `balance` IS NULL OR `balance` = 0;
