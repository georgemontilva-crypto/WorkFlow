-- Add Financial Profile fields to company_profiles table
-- Run this in TablePlus or your MySQL client

ALTER TABLE company_profiles 
ADD COLUMN business_type ENUM('freelancer', 'empresa', 'agencia') AFTER invoice_footer,
ADD COLUMN base_currency VARCHAR(3) DEFAULT 'USD' AFTER business_type,
ADD COLUMN monthly_income_goal DECIMAL(15,2) AFTER base_currency,
ADD COLUMN goal_currency VARCHAR(3) AFTER monthly_income_goal;

-- Verify the changes
SELECT * FROM company_profiles LIMIT 1;
