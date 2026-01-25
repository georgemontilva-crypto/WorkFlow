-- ================================================
-- NUEVA TABLA: notifications
-- Sistema de notificaciones V2 - Limpio y predecible
-- ================================================

CREATE TABLE IF NOT EXISTS notifications (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  
  -- Campos obligatorios
  type ENUM('info', 'success', 'warning', 'error') NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  priority ENUM('low', 'normal', 'high') NOT NULL DEFAULT 'normal',
  
  -- Estado
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- Índices para optimización
  INDEX idx_user_read (user_id, is_read),
  INDEX idx_user_created (user_id, created_at DESC),
  INDEX idx_priority (priority),
  
  -- Foreign key (si existe tabla users)
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================
-- NOTA: La tabla 'alerts' antigua se puede eliminar
-- después de verificar que el nuevo sistema funciona
-- ================================================
-- DROP TABLE IF EXISTS alerts;
