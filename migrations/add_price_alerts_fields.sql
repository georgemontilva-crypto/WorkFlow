-- Add missing fields to price_alerts table
ALTER TABLE price_alerts 
ADD COLUMN IF NOT EXISTS notify_app INT NOT NULL DEFAULT 1 AFTER notify_email,
ADD COLUMN IF NOT EXISTS triggered_at TIMESTAMP NULL AFTER notify_app;
