-- Update support_tickets table
ALTER TABLE support_tickets 
MODIFY COLUMN status ENUM('open', 'in_progress', 'waiting_user', 'waiting_agent', 'resolved', 'closed') NOT NULL DEFAULT 'open';

ALTER TABLE support_tickets 
ADD COLUMN IF NOT EXISTS assigned_to INT AFTER priority,
ADD COLUMN IF NOT EXISTS has_unread_user INT NOT NULL DEFAULT 0 AFTER assigned_to,
ADD COLUMN IF NOT EXISTS has_unread_agent INT NOT NULL DEFAULT 0 AFTER has_unread_user,
ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMP NULL AFTER has_unread_agent,
ADD COLUMN IF NOT EXISTS closed_at TIMESTAMP NULL AFTER resolved_at;

-- Update support_messages table
ALTER TABLE support_messages 
CHANGE COLUMN user_id sender_id INT NOT NULL;

ALTER TABLE support_messages 
ADD COLUMN IF NOT EXISTS sender_type ENUM('user', 'agent', 'ai') NOT NULL DEFAULT 'user' AFTER sender_id;

ALTER TABLE support_messages 
DROP COLUMN IF EXISTS is_staff;

ALTER TABLE support_messages 
ADD COLUMN IF NOT EXISTS is_read INT NOT NULL DEFAULT 0 AFTER message;
