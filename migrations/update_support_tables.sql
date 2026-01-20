-- Update support_tickets table
ALTER TABLE support_tickets 
MODIFY COLUMN status ENUM('open', 'in_progress', 'waiting_user', 'waiting_agent', 'resolved', 'closed') NOT NULL DEFAULT 'open';

-- Add columns to support_tickets (one by one to avoid IF NOT EXISTS issues)
ALTER TABLE support_tickets ADD COLUMN assigned_to INT AFTER priority;
ALTER TABLE support_tickets ADD COLUMN has_unread_user INT NOT NULL DEFAULT 0 AFTER assigned_to;
ALTER TABLE support_tickets ADD COLUMN has_unread_agent INT NOT NULL DEFAULT 0 AFTER has_unread_user;
ALTER TABLE support_tickets ADD COLUMN resolved_at TIMESTAMP NULL AFTER has_unread_agent;
ALTER TABLE support_tickets ADD COLUMN closed_at TIMESTAMP NULL AFTER resolved_at;

-- Update support_messages table
ALTER TABLE support_messages CHANGE COLUMN user_id sender_id INT NOT NULL;
ALTER TABLE support_messages ADD COLUMN sender_type ENUM('user', 'agent', 'ai') NOT NULL DEFAULT 'user' AFTER sender_id;
ALTER TABLE support_messages DROP COLUMN is_staff;
ALTER TABLE support_messages ADD COLUMN is_read INT NOT NULL DEFAULT 0 AFTER message;
