-- ============================================
-- MIGRACIÓN: Corrección del Modelo de Clients
-- ============================================
-- Fecha: 2026-01-25
-- Propósito: Eliminar campos financieros que NO pertenecen a la entidad cliente
-- Problema: Campo 'amount' es NOT NULL y causa error al crear clientes
-- Solución: Eliminar TODOS los campos financieros de la tabla clients

-- ============================================
-- PASO 1: Eliminar campos financieros
-- ============================================

-- 1. has_recurring_billing - Lógica de facturación, NO de cliente
ALTER TABLE clients DROP COLUMN IF EXISTS has_recurring_billing;

-- 2. billing_cycle - Configuración de factura, NO de cliente
ALTER TABLE clients DROP COLUMN IF EXISTS billing_cycle;

-- 3. custom_cycle_days - Configuración de factura, NO de cliente
ALTER TABLE clients DROP COLUMN IF EXISTS custom_cycle_days;

-- 4. amount - CRÍTICO: Monto financiero, NO de cliente
ALTER TABLE clients DROP COLUMN IF EXISTS amount;

-- 5. next_payment_date - Fecha de factura, NO de cliente
ALTER TABLE clients DROP COLUMN IF EXISTS next_payment_date;

-- 6. currency - Moneda de factura, NO de cliente
ALTER TABLE clients DROP COLUMN IF EXISTS currency;

-- 7. reminder_days - Configuración de recordatorio, NO de cliente
ALTER TABLE clients DROP COLUMN IF EXISTS reminder_days;

-- ============================================
-- PASO 2: Ajustar campos existentes
-- ============================================

-- Ajustar status enum (eliminar 'overdue' que es de facturas)
ALTER TABLE clients 
MODIFY COLUMN status ENUM('active', 'inactive') NOT NULL DEFAULT 'active';

-- Asegurar que phone sea nullable
ALTER TABLE clients 
MODIFY COLUMN phone VARCHAR(50) NULL;

-- Asegurar que company sea nullable
ALTER TABLE clients 
MODIFY COLUMN company VARCHAR(255) NULL;

-- ============================================
-- PASO 3: Verificar estructura final
-- ============================================

DESCRIBE clients;

-- ============================================
-- ESTRUCTURA FINAL ESPERADA (11 columnas):
-- ============================================
-- 1.  id              bigint unsigned    NO    PRI    NULL    auto_increment
-- 2.  user_id         int                NO            NULL
-- 3.  name            varchar(255)       NO            NULL
-- 4.  email           varchar(320)       NO            NULL
-- 5.  phone           varchar(50)        YES           NULL
-- 6.  company         varchar(255)       YES           NULL
-- 7.  status          enum               NO            active
-- 8.  archived        tinyint(1)         NO            0
-- 9.  notes           text               YES           NULL
-- 10. created_at      timestamp          NO            CURRENT_TIMESTAMP
-- 11. updated_at      timestamp          NO            CURRENT_TIMESTAMP
-- ============================================

-- ============================================
-- RESULTADO ESPERADO:
-- ============================================
-- ✅ Tabla clients con SOLO campos de identidad/contacto
-- ✅ Sin campos financieros
-- ✅ Creación de clientes funcional
-- ✅ Modelo correcto y coherente
-- ============================================
