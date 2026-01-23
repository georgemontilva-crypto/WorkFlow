-- Migration: Add company_profile_snapshot to invoices table
-- This field stores a JSON snapshot of the company profile at the time of invoice creation
-- This ensures invoices maintain consistent header information even if the profile is updated later

ALTER TABLE invoices 
ADD COLUMN company_profile_snapshot TEXT NULL AFTER notes;

-- Add comment to explain the field
ALTER TABLE invoices 
MODIFY COLUMN company_profile_snapshot TEXT NULL COMMENT 'JSON snapshot of company profile at invoice creation time';
