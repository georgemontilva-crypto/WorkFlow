-- Add public invoice portal fields and payment_submitted status
-- Migration: add_public_invoice_portal.sql

-- Step 1: Add new columns to invoices table
ALTER TABLE `invoices` 
ADD COLUMN `public_token` VARCHAR(255) NULL UNIQUE,
ADD COLUMN `payment_proof_url` TEXT NULL,
ADD COLUMN `payment_proof_uploaded_at` TIMESTAMP NULL,
ADD COLUMN `payment_reference` VARCHAR(255) NULL;

-- Step 2: Modify status enum to include payment_submitted
-- Note: MySQL doesn't support ALTER ENUM directly, so we need to modify the column
ALTER TABLE `invoices` 
MODIFY COLUMN `status` ENUM('draft', 'sent', 'payment_submitted', 'paid', 'partial', 'cancelled') NOT NULL DEFAULT 'draft';

-- Step 3: Generate public_token for existing invoices (optional, can be NULL)
-- This will be generated on-demand when needed
