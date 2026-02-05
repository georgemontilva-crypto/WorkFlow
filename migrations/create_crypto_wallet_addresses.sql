-- Migration: Create crypto_wallet_addresses table
-- Description: Tabla para almacenar direcciones públicas de criptomonedas
-- IMPORTANTE: Este NO es un wallet real - solo almacena direcciones públicas para referencia
-- NO custodia fondos, NO maneja llaves privadas, NO firma transacciones

CREATE TABLE IF NOT EXISTS `crypto_wallet_addresses` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `crypto_symbol` VARCHAR(20) NOT NULL COMMENT 'Símbolo de la criptomoneda (BTC, ETH, USDT, etc.)',
  `network` VARCHAR(50) NOT NULL COMMENT 'Red/Blockchain (Bitcoin, ERC20, TRC20, BEP20, etc.)',
  `address` VARCHAR(255) NOT NULL COMMENT 'Dirección pública de la wallet',
  `alias` VARCHAR(100) DEFAULT NULL COMMENT 'Alias opcional (ej: Binance, Personal, Cliente)',
  `note` TEXT DEFAULT NULL COMMENT 'Nota opcional',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Índices para optimizar consultas
  INDEX `idx_user` (`user_id`),
  INDEX `idx_user_crypto` (`user_id`, `crypto_symbol`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Almacena direcciones públicas de criptomonedas (NO custodia fondos)';
