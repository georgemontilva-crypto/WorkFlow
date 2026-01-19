-- Migration: Add trial_ends_at field to user table
-- Date: 2026-01-19
-- Description: Adds trial period tracking for new users

-- Add trial_ends_at column if it doesn't exist
ALTER TABLE `user` 
ADD COLUMN IF NOT EXISTS `trial_ends_at` TIMESTAMP NULL;

-- Set trial_ends_at for existing users (7 days from their created_at date)
UPDATE `user` 
SET `trial_ends_at` = DATE_ADD(`created_at`, INTERVAL 7 DAY)
WHERE `trial_ends_at` IS NULL;

-- Verify the migration
SELECT COUNT(*) as users_with_trial FROM `user` WHERE `trial_ends_at` IS NOT NULL;
