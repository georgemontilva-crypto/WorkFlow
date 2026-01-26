-- Migration: Increase payment_proof_url field size from TEXT to MEDIUMTEXT
-- This allows storing larger payment proof files (up to 16MB vs 64KB)
-- Date: 2026-01-25

ALTER TABLE `invoices` 
MODIFY COLUMN `payment_proof_url` MEDIUMTEXT;
