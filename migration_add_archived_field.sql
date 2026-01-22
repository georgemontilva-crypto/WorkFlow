-- Migration: Add 'archived' field to invoices table
-- Date: 2025-01-22
-- Description: Adds archived field to track archived invoices separately from status

-- Add archived column to invoices table
ALTER TABLE invoices 
ADD COLUMN archived INT NOT NULL DEFAULT 0 
AFTER status;

-- Add index for better query performance
CREATE INDEX idx_invoices_archived ON invoices(archived);

-- Optional: Update any existing data if needed
-- (This is safe to run even if no data exists)
UPDATE invoices SET archived = 0 WHERE archived IS NULL;

-- Verify the migration
SELECT 
  COLUMN_NAME, 
  DATA_TYPE, 
  IS_NULLABLE, 
  COLUMN_DEFAULT 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'invoices' 
  AND COLUMN_NAME = 'archived';
