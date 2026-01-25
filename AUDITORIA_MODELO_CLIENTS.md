# Auditoría del Modelo de Datos: Tabla `clients`

**Fecha:** 25 de enero de 2026  
**Estado:** ❌ MODELO INCORRECTO - Requiere corrección inmediata

---

## 🔴 PROBLEMA DETECTADO

**Error al crear clientes:**
```
Field 'amount' doesn't have a default value
```

**Causa raíz:** La tabla `clients` contiene campos financieros que NO pertenecen a la entidad cliente.

---

## 📊 ESTRUCTURA ACTUAL (INCORRECTA)

| # | Campo | Tipo | Null | Default | Problema |
|---|-------|------|------|---------|----------|
| 1 | id | bigint unsigned | NO | auto_increment | ✅ Correcto |
| 2 | user_id | int | NO | - | ✅ Correcto |
| 3 | name | varchar(255) | NO | - | ✅ Correcto |
| 4 | email | varchar(320) | NO | - | ✅ Correcto |
| 5 | phone | varchar(50) | YES | NULL | ✅ Correcto |
| 6 | company | varchar(255) | YES | NULL | ✅ Correcto |
| 7 | **has_recurring_billing** | tinyint(1) | NO | 0 | ❌ **NO pertenece** |
| 8 | **billing_cycle** | enum | YES | NULL | ❌ **NO pertenece** |
| 9 | **custom_cycle_days** | int | YES | NULL | ❌ **NO pertenece** |
| 10 | **amount** | decimal(10,2) | **NO** | - | ❌ **CRÍTICO** |
| 11 | **next_payment_date** | timestamp | NO | - | ❌ **NO pertenece** |
| 12 | **currency** | varchar(3) | NO | USD | ❌ **NO pertenece** |
| 13 | **reminder_days** | int | YES | NULL | ❌ **NO pertenece** |
| 14 | status | enum | NO | active | ✅ Correcto |
| 15 | archived | tinyint(1) | NO | 0 | ✅ Correcto |
| 16 | notes | text | YES | NULL | ✅ Correcto |
| 17 | created_at | timestamp | NO | now() | ✅ Correcto |
| 18 | updated_at | timestamp | NO | now() | ✅ Correcto |

**Total:** 18 columnas  
**Correctas:** 11 columnas  
**Incorrectas:** 7 columnas

---

## 🎯 ANÁLISIS DE MODELO

### ❌ CAMPOS QUE NO PERTENECEN A `clients`

#### 1. `has_recurring_billing` (tinyint)
- **Qué es:** Flag para indicar si el cliente tiene facturación recurrente
- **Por qué NO pertenece:** La recurrencia es una propiedad de la FACTURA, no del cliente
- **Dónde debería estar:** En la tabla `invoices` (ya existe como `is_recurring`)

#### 2. `billing_cycle` (enum: monthly, quarterly, yearly, custom)
- **Qué es:** Ciclo de facturación
- **Por qué NO pertenece:** El ciclo es una configuración de la FACTURA recurrente
- **Dónde debería estar:** En la tabla `invoices` (ya existe como `recurrence_frequency`)

#### 3. `custom_cycle_days` (int)
- **Qué es:** Días personalizados para ciclo custom
- **Por qué NO pertenece:** Configuración de factura, no de cliente
- **Dónde debería estar:** En la tabla `invoices` (ya existe como `recurrence_interval`)

#### 4. `amount` (decimal) - **CRÍTICO**
- **Qué es:** Monto financiero
- **Por qué NO pertenece:** Un cliente NO es un balance. Los montos pertenecen a facturas/pagos
- **Dónde debería estar:** En las tablas `invoices` y `transactions`
- **Problema:** Es NOT NULL sin default, causa el error de creación

#### 5. `next_payment_date` (timestamp)
- **Qué es:** Fecha del próximo pago
- **Por qué NO pertenece:** Las fechas de pago son de facturas, no de clientes
- **Dónde debería estar:** En la tabla `invoices` (ya existe como `next_generation_date`)

#### 6. `currency` (varchar)
- **Qué es:** Moneda
- **Por qué NO pertenece:** La moneda es de la factura, no del cliente
- **Dónde debería estar:** En la tabla `invoices` (ya existe)

#### 7. `reminder_days` (int)
- **Qué es:** Días antes para enviar recordatorio
- **Por qué NO pertenece:** Configuración de recordatorio, no atributo de cliente
- **Dónde debería estar:** En la tabla `reminders` o como configuración de usuario

---

## ✅ MODELO CORRECTO DE `clients`

Un cliente es una **entidad de contacto e identidad**, NO un balance financiero.

### Campos que DEBE tener:

| Campo | Tipo | Null | Default | Propósito |
|-------|------|------|---------|-----------|
| id | bigint unsigned | NO | auto_increment | Identificador único |
| user_id | int | NO | - | Propietario del cliente |
| name | varchar(255) | NO | - | Nombre del cliente |
| email | varchar(320) | NO | - | Email de contacto |
| phone | varchar(50) | YES | NULL | Teléfono (opcional) |
| company | varchar(255) | YES | NULL | Empresa (opcional) |
| status | enum('active','inactive') | NO | active | Estado del cliente |
| archived | tinyint(1) | NO | 0 | Si está archivado |
| notes | text | YES | NULL | Notas adicionales |
| created_at | timestamp | NO | now() | Fecha de creación |
| updated_at | timestamp | NO | now() | Fecha de actualización |

**Total:** 11 columnas

---

## 🔄 SEPARACIÓN DE RESPONSABILIDADES

### 📋 Tabla `clients` (Entidad de Contacto)
- Información de identidad
- Datos de contacto
- Estado y metadata

### 💰 Tabla `invoices` (Entidad Financiera)
- Montos y balances
- Fechas de pago
- Recurrencia y ciclos
- Moneda

### 💳 Tabla `transactions` (Movimientos)
- Pagos realizados
- Historial financiero
- Balances calculados

### 🔔 Tabla `reminders` (Notificaciones)
- Recordatorios de pago
- Días antes de notificar
- Estado de envío

---

## 🚨 IMPACTO DEL ERROR

### Problema Actual:
1. **No se pueden crear clientes** porque `amount` es NOT NULL
2. El código simplificado NO envía `amount` en el INSERT
3. MySQL rechaza el INSERT con error

### Consecuencias:
- ❌ Sistema de clientes completamente roto
- ❌ No se pueden registrar nuevos clientes
- ❌ Modelo de datos confuso e inconsistente
- ❌ Mezcla de responsabilidades (cliente vs factura)

---

## ✅ SOLUCIÓN REQUERIDA

### Migración SQL:

```sql
-- Eliminar campos financieros que no pertenecen a clients
ALTER TABLE clients DROP COLUMN has_recurring_billing;
ALTER TABLE clients DROP COLUMN billing_cycle;
ALTER TABLE clients DROP COLUMN custom_cycle_days;
ALTER TABLE clients DROP COLUMN amount;              -- CRÍTICO
ALTER TABLE clients DROP COLUMN next_payment_date;
ALTER TABLE clients DROP COLUMN currency;
ALTER TABLE clients DROP COLUMN reminder_days;

-- Ajustar status enum (eliminar 'overdue' que es de facturas)
ALTER TABLE clients MODIFY COLUMN status ENUM('active', 'inactive') NOT NULL DEFAULT 'active';
```

---

## 📊 RESULTADO ESPERADO

Después de la migración:

| Campo | Tipo | Null | Default |
|-------|------|------|---------|
| id | bigint unsigned | NO | auto_increment |
| user_id | int | NO | - |
| name | varchar(255) | NO | - |
| email | varchar(320) | NO | - |
| phone | varchar(50) | YES | NULL |
| company | varchar(255) | YES | NULL |
| status | enum('active','inactive') | NO | active |
| archived | tinyint(1) | NO | 0 |
| notes | text | YES | NULL |
| created_at | timestamp | NO | now() |
| updated_at | timestamp | NO | now() |

**Total:** 11 columnas (solo las correctas)

---

## 🎯 PRINCIPIOS DE DISEÑO

### 1. Separación de Responsabilidades
- Cada tabla representa UNA entidad
- No mezclar conceptos (cliente ≠ factura ≠ pago)

### 2. Normalización
- Los datos financieros están en tablas financieras
- Los datos de contacto están en tablas de contacto

### 3. Claridad
- El nombre de la tabla indica su propósito
- Los campos son coherentes con la entidad

### 4. Mantenibilidad
- Modelo simple y predecible
- Fácil de entender y modificar

---

## 📝 CONCLUSIÓN

**El modelo actual de `clients` es INCORRECTO.**

Contiene 7 campos que NO pertenecen a la entidad cliente, causando:
- Errores de creación
- Confusión en el código
- Duplicación de lógica
- Modelo inconsistente

**Acción requerida:** Ejecutar migración para eliminar campos financieros.

---

**Un cliente es una persona/empresa, NO un balance financiero.** ✅
