-- Tabla de reportes de bugs (formulario one-way)
CREATE TABLE IF NOT EXISTS bug_reports_form (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  steps_to_reproduce TEXT,
  expected_behavior TEXT,
  actual_behavior TEXT,
  attachment_url VARCHAR(500),
  status ENUM('new', 'in_progress', 'resolved', 'closed') DEFAULT 'new',
  priority ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
  admin_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_user (user_id),
  INDEX idx_status (status),
  INDEX idx_priority (priority),
  INDEX idx_user_status (user_id, status),
  FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
