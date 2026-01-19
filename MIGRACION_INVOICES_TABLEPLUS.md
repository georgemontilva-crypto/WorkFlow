# 🗄️ Migración TablePlus - Corrección de Invoices

## 🎯 Problema
Al intentar crear una factura (invoice), aparece un error porque faltan los campos `paid_amount` y `balance` en la tabla `invoices`.

## ✅ Solución Rápida con TablePlus

---

## 📋 Pasos para Aplicar la Migración

### 1️⃣ Abrir TablePlus y Conectar

1. **Abre TablePlus**
2. **Conecta a tu base de datos** (la misma conexión que ya tienes configurada)
3. **Selecciona la base de datos** del proyecto

### 2️⃣ Abrir el Editor SQL

- **Mac:** Presiona `Cmd + K`
- **Windows/Linux:** Presiona `Ctrl + K`
- O haz clic en el botón **"SQL"** en la barra superior

### 3️⃣ Copiar y Ejecutar este SQL

```sql
-- ========================================
-- Migración: Agregar paid_amount y balance a invoices
-- Fecha: 2026-01-19
-- ========================================

-- Paso 1: Agregar campo paid_amount (monto pagado parcialmente)
ALTER TABLE `invoices` 
ADD COLUMN `paid_amount` DECIMAL(10,2) NOT NULL DEFAULT '0' AFTER `total`;

-- Paso 2: Agregar campo balance (saldo pendiente)
ALTER TABLE `invoices` 
ADD COLUMN `balance` DECIMAL(10,2) NOT NULL AFTER `paid_amount`;

-- Paso 3: Actualizar facturas existentes para que balance = total
UPDATE `invoices` 
SET `balance` = `total` 
WHERE `balance` = 0 OR `balance` IS NULL;

-- Paso 4: Verificar que todo está correcto
SELECT 
    id,
    invoice_number,
    total,
    paid_amount,
    balance,
    status
FROM `invoices`
LIMIT 10;
```

### 4️⃣ Ejecutar

- **Mac:** Presiona `Cmd + Enter`
- **Windows/Linux:** Presiona `Ctrl + Enter`
- O haz clic en el botón **"Run"** ▶️

### 5️⃣ Verificar Resultado

Deberías ver:
- ✅ "Query OK, X rows affected" (para cada ALTER TABLE)
- ✅ Una tabla con las facturas mostrando los nuevos campos

---

## 🔍 Verificación Adicional

Para confirmar que los campos se agregaron correctamente, ejecuta:

```sql
DESCRIBE `invoices`;
```

**Deberías ver:**
```
...
total          | decimal(10,2) | NO   |     | NULL    |
paid_amount    | decimal(10,2) | NO   |     | 0.00    |  ← NUEVO
balance        | decimal(10,2) | NO   |     | NULL    |  ← NUEVO
status         | enum(...)     | NO   |     | draft   |
...
```

---

## 🎉 ¡Listo! Ahora Prueba Crear una Factura

1. **Reinicia tu servidor de desarrollo** (si está corriendo)
   ```bash
   # Detén el servidor (Ctrl+C)
   # Vuelve a iniciarlo
   pnpm dev
   ```

2. **Ve a la sección de Facturas** en tu aplicación

3. **Intenta crear una nueva factura**
   - Selecciona un cliente
   - Agrega items
   - Haz clic en "Crear Factura"

4. ✅ **Debería crearse sin errores**

---

## 🚨 Solución de Problemas

### ❌ Error: "Duplicate column name 'paid_amount'"

**Causa:** Los campos ya existen en tu base de datos.

**Solución:** ¡Perfecto! No necesitas hacer nada. La migración ya fue aplicada anteriormente.

---

### ❌ Error: "Access denied for user"

**Causa:** Tu usuario de base de datos no tiene permisos para modificar tablas.

**Solución:**
1. Verifica que estés usando el usuario correcto (generalmente `root`)
2. Si usas Railway, asegúrate de usar las credenciales correctas
3. Contacta al administrador si no tienes permisos

---

### ❌ Error: "Table 'invoices' doesn't exist"

**Causa:** Estás conectado a la base de datos incorrecta.

**Solución:**
1. Verifica el selector de base de datos en la parte superior de TablePlus
2. Cambia a la base de datos correcta (probablemente `railway` o `hiwork`)

---

## 📊 ¿Qué Hacen Estos Campos?

### `paid_amount` (Monto Pagado)
- Almacena cuánto ha pagado el cliente de la factura
- Por defecto es `0.00` (sin pagos)
- Permite registrar pagos parciales

### `balance` (Saldo Pendiente)
- Calcula automáticamente: `balance = total - paid_amount`
- Muestra cuánto falta por pagar
- Si `balance = 0`, la factura está completamente pagada

### Ejemplo:
```
Factura #001
Total: $1000.00
Paid Amount: $300.00
Balance: $700.00  ← Falta por pagar
```

---

## ⏱️ Tiempo Estimado

- **Abrir TablePlus:** 10 segundos
- **Copiar y pegar SQL:** 20 segundos
- **Ejecutar migración:** 5 segundos
- **Verificar:** 10 segundos
- **Total:** ~1 minuto

---

## ✅ Checklist

- [ ] Abrir TablePlus
- [ ] Conectar a la base de datos
- [ ] Abrir editor SQL (Cmd+K / Ctrl+K)
- [ ] Copiar el SQL completo
- [ ] Pegar en TablePlus
- [ ] Ejecutar (Cmd+Enter / Ctrl+Enter)
- [ ] Verificar con DESCRIBE
- [ ] Reiniciar servidor de desarrollo
- [ ] Probar crear una factura
- [ ] ✅ Todo funcionando

---

## 📝 Resumen de Cambios

Esta migración agrega soporte para:
- ✅ Pagos parciales en facturas
- ✅ Seguimiento de saldo pendiente
- ✅ Cálculo automático de balance
- ✅ Compatibilidad con facturas existentes

**¡Listo para usar!** 🎉
