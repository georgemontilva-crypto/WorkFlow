-- Migration: Change from base64 storage to filesystem storage
-- This migration changes payment proof storage from MEDIUMTEXT (base64) to filesystem with metadata
-- Date: 2026-01-25

-- Step 1: Add new columns for filesystem storage
ALTER TABLE `invoices` 
ADD COLUMN `receipt_path` VARCHAR(255) AFTER `public_token`,
ADD COLUMN `receipt_size` INT AFTER `receipt_path`,
ADD COLUMN `receipt_mime` VARCHAR(50) AFTER `receipt_size`;

-- Step 2: Drop old column (only after confirming all data is migrated)
-- IMPORTANT: Run this ONLY after verifying that all existing receipts have been migrated
-- ALTER TABLE `invoices` DROP COLUMN `payment_proof_url`;

-- Note: If you have existing data in payment_proof_url, you'll need to:
-- 1. Keep the old column temporarily
-- 2. Manually migrate existing base64 data to filesystem
-- 3. Then drop the old column

-- For new installations, you can safely drop payment_proof_url immediately:
-- ALTER TABLE `invoices` DROP COLUMN `payment_proof_url`;
