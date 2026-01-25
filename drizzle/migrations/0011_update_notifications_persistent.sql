-- Migration: Update notifications table for persistent notifications system
-- Remove priority field, add source and source_id fields

-- Add source column
ALTER TABLE notifications 
ADD COLUMN source ENUM('invoice', 'savings', 'system') NOT NULL DEFAULT 'system' AFTER message;

-- Add source_id column (nullable)
ALTER TABLE notifications 
ADD COLUMN source_id BIGINT UNSIGNED NULL AFTER source;

-- Remove priority column if exists
ALTER TABLE notifications 
DROP COLUMN IF EXISTS priority;

-- Add index for source lookups
CREATE INDEX idx_source ON notifications(source, source_id);

-- Remove old priority index if exists
DROP INDEX IF EXISTS idx_priority ON notifications;
