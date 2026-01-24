-- Migración: Agregar soporte para clientes no recurrentes
-- Fecha: 2026-01-24
-- Descripción: Permite crear clientes sin ciclo de facturación (pago por proyecto)

-- 1. Agregar columna has_recurring_billing
ALTER TABLE `clients` 
ADD COLUMN `has_recurring_billing` BOOLEAN NOT NULL DEFAULT FALSE 
AFTER `company`;

-- 2. Actualizar clientes existentes como recurrentes (tienen billing_cycle definido)
UPDATE `clients` 
SET `has_recurring_billing` = TRUE 
WHERE `billing_cycle` IS NOT NULL;

-- 3. Hacer billing_cycle opcional (permitir NULL)
ALTER TABLE `clients` 
MODIFY COLUMN `billing_cycle` ENUM('monthly', 'quarterly', 'yearly', 'custom') NULL;

-- 4. Hacer amount opcional (permitir NULL)
ALTER TABLE `clients` 
MODIFY COLUMN `amount` DECIMAL(10, 2) NULL;

-- 5. Hacer next_payment_date opcional (permitir NULL)
ALTER TABLE `clients` 
MODIFY COLUMN `next_payment_date` TIMESTAMP NULL;

-- Verificación: Mostrar estructura actualizada
-- DESCRIBE `clients`;
