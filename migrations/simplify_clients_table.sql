-- Migration: Simplificar tabla clients - Eliminar campos problemáticos
-- Date: 2026-01-25
-- Purpose: Hacer la tabla clients ultra-simple y funcional

-- Eliminar columnas problemáticas de billing
ALTER TABLE clients DROP COLUMN IF EXISTS has_recurring_billing;
ALTER TABLE clients DROP COLUMN IF EXISTS billing_cycle;
ALTER TABLE clients DROP COLUMN IF EXISTS custom_cycle_days;
ALTER TABLE clients DROP COLUMN IF EXISTS amount;
ALTER TABLE clients DROP COLUMN IF EXISTS next_payment_date;
ALTER TABLE clients DROP COLUMN IF EXISTS reminder_days;
ALTER TABLE clients DROP COLUMN IF EXISTS currency;

-- Hacer phone opcional (si no lo es ya)
ALTER TABLE clients MODIFY COLUMN phone VARCHAR(50) NULL;

-- Verificar estructura final
DESCRIBE clients;

-- La tabla final debe tener solo:
-- id, user_id, name, email, phone, company, status, archived, notes, created_at, updated_at
