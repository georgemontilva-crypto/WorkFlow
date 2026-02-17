-- ============================================
-- REPLACE OLD SUPPORT SYSTEM WITH NEW REAL-TIME CHAT
-- ============================================
-- This migration replaces the old support ticket system
-- with a new real-time chat system using Socket.IO

-- 1. DROP OLD SUPPORT TABLES
-- ============================================
DROP TABLE IF EXISTS support_messages;
DROP TABLE IF EXISTS support_tickets;

-- 2. CREATE NEW SUPPORT TABLES
-- ============================================

-- Conversations table
CREATE TABLE support_conversations (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  status ENUM('bot', 'waiting_agent', 'active', 'closed') NOT NULL DEFAULT 'bot',
  assigned_agent_id BIGINT UNSIGNED NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_assigned_agent (assigned_agent_id),
  INDEX idx_last_message (last_message_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Messages table
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

-- ============================================
-- NOTES
-- ============================================
-- support_conversations.status:
--   - bot: User is interacting with the bot
--   - waiting_agent: User needs human agent, in queue
--   - active: Human agent assigned and conversation active
--   - closed: Conversation closed

-- support_messages.sender_type:
--   - user: Message from user
--   - bot: Automatic message from bot
--   - agent: Message from human agent
