-- Migración: Reconstruir sistema de facturas desde cero
-- Fecha: 2026-01-24
-- Objetivo: Eliminar campos innecesarios y crear tabla de ítems separada

-- 1. Crear tabla de invoice_items (nueva)
CREATE TABLE IF NOT EXISTS `invoice_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `invoice_id` INT NOT NULL,
  `description` TEXT NOT NULL,
  `quantity` DECIMAL(10, 2) NOT NULL,
  `unit_price` DECIMAL(10, 2) NOT NULL,
  `total` DECIMAL(10, 2) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON DELETE CASCADE,
  INDEX `idx_invoice_items_invoice_id` (`invoice_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Eliminar campos innecesarios de invoices
ALTER TABLE `invoices` 
  DROP COLUMN IF EXISTS `items`,
  DROP COLUMN IF EXISTS `tax`,
  DROP COLUMN IF EXISTS `paid_amount`,
  DROP COLUMN IF EXISTS `balance`,
  DROP COLUMN IF EXISTS `archived`,
  DROP COLUMN IF EXISTS `payment_token`,
  DROP COLUMN IF EXISTS `payment_link`,
  DROP COLUMN IF EXISTS `client_comment`,
  DROP COLUMN IF EXISTS `company_profile_snapshot`,
  DROP COLUMN IF EXISTS `is_recurring`,
  DROP COLUMN IF EXISTS `recurrence_frequency`,
  DROP COLUMN IF EXISTS `recurrence_interval`,
  DROP COLUMN IF EXISTS `next_generation_date`,
  DROP COLUMN IF EXISTS `parent_invoice_id`;

-- 3. Modificar enum de status para solo los estados necesarios
ALTER TABLE `invoices` 
  MODIFY COLUMN `status` ENUM('draft', 'sent', 'paid', 'cancelled') NOT NULL DEFAULT 'draft';

-- 4. Agregar campo terms si no existe
ALTER TABLE `invoices` 
  ADD COLUMN IF NOT EXISTS `terms` TEXT NULL AFTER `notes`;

-- Nota: Esta migración eliminará datos existentes en los campos que se eliminan
-- Ejecutar solo después de hacer backup de la base de datos
