-- Add is_urgent field to notifications table
ALTER TABLE notifications ADD COLUMN is_urgent INT NOT NULL DEFAULT 0 AFTER is_read;

-- Add index for urgent notifications
CREATE INDEX idx_user_urgent ON notifications(user_id, is_urgent, created_at);
