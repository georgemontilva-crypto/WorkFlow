-- Create market_favorites table for storing user's favorite market assets
CREATE TABLE IF NOT EXISTS market_favorites (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  symbol VARCHAR(20) NOT NULL,
  type ENUM('crypto', 'stock', 'forex', 'commodity') NOT NULL,
  is_dashboard_widget INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  UNIQUE KEY unique_user_symbol (user_id, symbol),
  INDEX idx_user_id (user_id),
  INDEX idx_dashboard_widget (user_id, is_dashboard_widget)
);

-- Verify table creation
DESCRIBE market_favorites;
