-- Migration: Update savings_goals table for independent savings module
-- Date: 2026-01-24
-- Changes:
-- 1. Remove default value from currency column
-- 2. Rename target_date to deadline
-- 3. Add description column

-- Step 1: Add new columns
ALTER TABLE savings_goals 
ADD COLUMN deadline TIMESTAMP NULL AFTER currency,
ADD COLUMN description TEXT NULL AFTER deadline;

-- Step 2: Copy data from target_date to deadline
UPDATE savings_goals SET deadline = target_date WHERE target_date IS NOT NULL;

-- Step 3: Drop old column
ALTER TABLE savings_goals DROP COLUMN target_date;

-- Step 4: Remove default from currency (if it exists)
ALTER TABLE savings_goals MODIFY COLUMN currency VARCHAR(3) NOT NULL;

-- Note: Existing rows with currency='USD' will keep that value
-- New rows MUST explicitly provide a currency value
