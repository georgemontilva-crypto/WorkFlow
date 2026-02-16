-- ============================================
-- SUPPORT CHAT SYSTEM - REAL-TIME SUPPORT
-- ============================================
-- Eliminar sistema anterior de bugs y crear nuevo sistema de soporte en tiempo real

-- 1. ELIMINAR TABLAS ANTIGUAS
-- ============================================
DROP TABLE IF EXISTS bug_messages;
DROP TABLE IF EXISTS bug_conversations;
DROP TABLE IF EXISTS bug_reports_form;

-- 2. CREAR NUEVAS TABLAS
-- ============================================

-- Tabla de conversaciones de soporte
CREATE TABLE IF NOT EXISTS support_conversations (
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
  INDEX idx_last_message (last_message_at),
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_agent_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de mensajes de soporte
CREATE TABLE IF NOT EXISTS support_messages (
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
  
  FOREIGN KEY (conversation_id) REFERENCES support_conversations(id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. COMENTARIOS
-- ============================================
-- support_conversations.status:
--   - bot: Usuario está interactuando con el bot
--   - waiting_agent: Usuario necesita agente humano, en cola
--   - active: Agente humano asignado y conversación activa
--   - closed: Conversación cerrada

-- support_messages.sender_type:
--   - user: Mensaje del usuario
--   - bot: Mensaje automático del bot
--   - agent: Mensaje del agente humano

-- Índices optimizados para:
--   - Buscar conversaciones por usuario
--   - Filtrar por estado (cola de espera)
--   - Buscar conversaciones asignadas a agente
--   - Ordenar por último mensaje
--   - Marcar mensajes como leídos
