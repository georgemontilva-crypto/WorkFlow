-- Add subscription plan fields to user table
ALTER TABLE user 
ADD COLUMN subscription_plan ENUM('free', 'pro', 'business') NOT NULL DEFAULT 'free' AFTER has_lifetime_access,
ADD COLUMN subscription_status ENUM('active', 'cancelled', 'past_due', 'trialing') DEFAULT 'active' AFTER subscription_plan,
ADD COLUMN stripe_subscription_id VARCHAR(255) AFTER stripe_payment_id,
ADD COLUMN subscription_ends_at TIMESTAMP NULL AFTER subscription_status;

-- Remove trial_ends_at as we're using subscription-based model now
-- ALTER TABLE user DROP COLUMN trial_ends_at;
