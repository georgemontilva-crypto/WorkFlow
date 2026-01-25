# Deployment: Clientes No Recurrentes

## ✅ Cambios Implementados

Se ha agregado soporte para clientes que pagan por proyecto (no recurrentes), permitiendo mayor flexibilidad en la gestión de clientes.

---

## 🔧 CAMBIOS REALIZADOS

### 1. **Frontend (Clients.tsx)**
- ✅ Toggle "Cliente Recurrente" con explicación clara
- ✅ Campos de facturación solo visibles si es recurrente
- ✅ Formulario más limpio para clientes por proyecto

### 2. **Schema (drizzle/schema.ts)**
- ✅ `has_recurring_billing`: BOOLEAN NOT NULL DEFAULT FALSE
- ✅ `billing_cycle`: Ahora opcional (NULL permitido)
- ✅ `amount`: Ahora opcional (NULL permitido)
- ✅ `next_payment_date`: Ahora opcional (NULL permitido)

### 3. **Backend (server/routers.ts)**
- ✅ Lógica condicional para guardar solo campos relevantes
- ✅ Validación correcta según tipo de cliente

---

## 📋 MIGRACIÓN SQL REQUERIDA

**⚠️ IMPORTANTE:** Debes ejecutar esta migración en TablePlus antes de usar la nueva funcionalidad.

```sql
-- 1. Agregar columna has_recurring_billing
ALTER TABLE `clients` 
ADD COLUMN `has_recurring_billing` BOOLEAN NOT NULL DEFAULT FALSE 
AFTER `company`;

-- 2. Actualizar clientes existentes como recurrentes
UPDATE `clients` 
SET `has_recurring_billing` = TRUE 
WHERE `billing_cycle` IS NOT NULL;

-- 3. Hacer billing_cycle opcional
ALTER TABLE `clients` 
MODIFY COLUMN `billing_cycle` ENUM('monthly', 'quarterly', 'yearly', 'custom') NULL;

-- 4. Hacer amount opcional
ALTER TABLE `clients` 
MODIFY COLUMN `amount` DECIMAL(10, 2) NULL;

-- 5. Hacer next_payment_date opcional
ALTER TABLE `clients` 
MODIFY COLUMN `next_payment_date` TIMESTAMP NULL;
```

---

## 🚀 PASOS DE DEPLOYMENT

### Paso 1: Ejecutar Migración SQL

1. **Abre TablePlus**
2. **Conéctate a tu base de datos de Railway**
3. **Presiona ⌘ + E** (o Ctrl + E) para abrir el editor SQL
4. **Copia y pega el SQL de arriba**
5. **Presiona ⌘ + R** (o Ctrl + R) para ejecutar
6. **Verifica:** `DESCRIBE clients;` para confirmar cambios

### Paso 2: Esperar Deployment de Railway

- El código ya está pusheado (commit `a72e4e6`)
- Railway desplegará automáticamente en 2-3 minutos
- Verifica en Railway → Deployments que el deployment sea exitoso

### Paso 3: Probar la Funcionalidad

1. **Ve a Clientes → Agregar Cliente**
2. **Verás el toggle "Cliente Recurrente"** (desactivado por defecto)
3. **Si NO activas el toggle:**
   - Solo verás campos básicos (nombre, email, teléfono, empresa)
   - Perfecto para clientes por proyecto
4. **Si activas el toggle:**
   - Aparecerán los campos de facturación
   - Ciclo de facturación, monto, próximo pago, etc.

---

## 📊 COMPORTAMIENTO

### Cliente NO Recurrente (Toggle OFF)
```
✅ Nombre
✅ Email
✅ Teléfono
✅ Empresa
✅ Estado
✅ Notas
❌ Ciclo de facturación (oculto)
❌ Monto (oculto)
❌ Próximo pago (oculto)
❌ Recordatorios (oculto)
```

### Cliente Recurrente (Toggle ON)
```
✅ Nombre
✅ Email
✅ Teléfono
✅ Empresa
✅ Estado
✅ Ciclo de facturación
✅ Monto
✅ Próximo pago
✅ Recordatorios
✅ Notas
```

---

## 🔄 CLIENTES EXISTENTES

Todos los clientes existentes serán marcados automáticamente como **recurrentes** (`has_recurring_billing = TRUE`) durante la migración, preservando su comportamiento actual.

---

## ✅ VALIDACIÓN

Después del deployment, verifica:

1. ✅ Puedes crear cliente sin activar toggle (no recurrente)
2. ✅ Puedes crear cliente con toggle activado (recurrente)
3. ✅ Los clientes existentes siguen funcionando normalmente
4. ✅ No hay errores en los logs de Railway

---

## 📝 NOTAS

- **Clientes por proyecto:** No generan recordatorios automáticos
- **Clientes recurrentes:** Mantienen todo el comportamiento anterior
- **Flexibilidad:** Puedes editar un cliente y cambiar su tipo después

---

**Archivo de migración:** `migrations/add_has_recurring_billing.sql`
