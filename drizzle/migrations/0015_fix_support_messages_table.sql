-- ============================================
-- FIX SUPPORT_MESSAGES TABLE STRUCTURE
-- ============================================
-- This migration fixes the support_messages table structure
-- by dropping and recreating it with the correct schema

-- Drop foreign keys first (if they exist)
ALTER TABLE support_messages DROP FOREIGN KEY IF EXISTS support_messages_ibfk_1;
ALTER TABLE support_messages DROP FOREIGN KEY IF EXISTS support_messages_ibfk_2;

-- Drop the old table
DROP TABLE support_messages;

-- Recreate with correct structure
CREATE TABLE support_messages (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  conversation_id BIGINT UNSIGNED NOT NULL,
  sender_type ENUM('user', 'bot', 'agent') NOT NULL,
  sender_id BIGINT UNSIGNED NULL COMMENT 'NULL for bot messages',
  message TEXT NOT NULL,
  read_by_user BOOLEAN DEFAULT FALSE,
  read_by_agent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_conversation (conversation_id),
  INDEX idx_sender_type (sender_type),
  INDEX idx_created_at (created_at),
  INDEX idx_read_status (read_by_user, read_by_agent),
  
  FOREIGN KEY (conversation_id) REFERENCES support_conversations(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
