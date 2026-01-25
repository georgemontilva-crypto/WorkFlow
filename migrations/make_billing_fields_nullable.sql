-- Migration: Make billing fields nullable for non-recurring clients
-- Date: 2026-01-25
-- Purpose: Allow null values in billing fields when has_recurring_billing = false

-- Make billing_cycle nullable (currently NOT NULL)
ALTER TABLE clients 
MODIFY COLUMN billing_cycle ENUM('monthly', 'quarterly', 'yearly', 'custom') NULL;

-- Make reminder_days nullable (currently NOT NULL with default 7)
ALTER TABLE clients 
MODIFY COLUMN reminder_days INT NULL;

-- Verify the changes
DESCRIBE clients;
