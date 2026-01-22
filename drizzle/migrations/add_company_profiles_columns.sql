-- Add missing columns to company_profiles table
-- This migration adds columns that may be missing from the table

-- First, check if the table exists and add columns if they don't exist
ALTER TABLE company_profiles 
ADD COLUMN IF NOT EXISTS bank_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS bank_account VARCHAR(100),
ADD COLUMN IF NOT EXISTS bank_routing VARCHAR(100),
ADD COLUMN IF NOT EXISTS payment_instructions TEXT,
ADD COLUMN IF NOT EXISTS invoice_footer TEXT;
