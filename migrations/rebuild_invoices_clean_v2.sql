-- Migración: Reconstruir sistema de facturas desde cero (CORREGIDA)
-- Fecha: 2026-01-24
-- Objetivo: Eliminar campos innecesarios y crear tabla de ítems separada
-- Versión: 2 (tipos de datos corregidos)

-- IMPORTANTE: Hacer backup de la tabla invoices antes de ejecutar

-- 1. Crear tabla de invoice_items (nueva) con tipo compatible
CREATE TABLE IF NOT EXISTS `invoice_items` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `invoice_id` BIGINT UNSIGNED NOT NULL,
  `description` TEXT NOT NULL,
  `quantity` DECIMAL(10, 2) NOT NULL,
  `unit_price` DECIMAL(10, 2) NOT NULL,
  `total` DECIMAL(10, 2) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON DELETE CASCADE,
  INDEX `idx_invoice_items_invoice_id` (`invoice_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Eliminar campos innecesarios de invoices (uno por uno para evitar errores)
ALTER TABLE `invoices` DROP COLUMN IF EXISTS `items`;
ALTER TABLE `invoices` DROP COLUMN IF EXISTS `tax`;
ALTER TABLE `invoices` DROP COLUMN IF EXISTS `paid_amount`;
ALTER TABLE `invoices` DROP COLUMN IF EXISTS `balance`;
ALTER TABLE `invoices` DROP COLUMN IF EXISTS `archived`;
ALTER TABLE `invoices` DROP COLUMN IF EXISTS `payment_token`;
ALTER TABLE `invoices` DROP COLUMN IF EXISTS `payment_link`;
ALTER TABLE `invoices` DROP COLUMN IF EXISTS `payment_proof_uploaded_at`;
ALTER TABLE `invoices` DROP COLUMN IF EXISTS `client_comment`;
ALTER TABLE `invoices` DROP COLUMN IF EXISTS `company_profile_snapshot`;
ALTER TABLE `invoices` DROP COLUMN IF EXISTS `is_recurring`;
ALTER TABLE `invoices` DROP COLUMN IF EXISTS `recurrence_frequency`;
ALTER TABLE `invoices` DROP COLUMN IF EXISTS `recurrence_interval`;
ALTER TABLE `invoices` DROP COLUMN IF EXISTS `next_generation_date`;
ALTER TABLE `invoices` DROP COLUMN IF EXISTS `parent_invoice_id`;

-- 3. Modificar enum de status para solo los estados necesarios
ALTER TABLE `invoices` 
  MODIFY COLUMN `status` ENUM('draft', 'sent', 'paid', 'cancelled') NOT NULL DEFAULT 'draft';

-- 4. Agregar campo terms si no existe
ALTER TABLE `invoices` 
  ADD COLUMN IF NOT EXISTS `terms` TEXT NULL AFTER `notes`;

-- 5. Verificar estructura final
-- Ejecutar después de la migración:
-- DESCRIBE invoices;
-- DESCRIBE invoice_items;
