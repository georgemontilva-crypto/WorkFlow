# Migración: Hacer Campos de Billing Nullable

**Fecha:** 25 de enero de 2026  
**Archivo:** `migrations/make_billing_fields_nullable.sql`

---

## 🔴 PROBLEMA

Cuando se intenta crear un cliente **NO recurrente** (`has_recurring_billing = false`), el sistema falla con:

```
Column 'billing_cycle' cannot be null
```

**Causa raíz:**

- El **schema de Drizzle** define `billing_cycle` como nullable (sin `.notNull()`)
- La **tabla real en MySQL** tiene `billing_cycle` como `NOT NULL`
- Cuando el código envía `NULL` para clientes no recurrentes, MySQL rechaza el INSERT

---

## ✅ SOLUCIÓN

Modificar la tabla `clients` para permitir valores `NULL` en los campos de billing:

1. `billing_cycle` - Cambiar de `NOT NULL` a `NULL`
2. `reminder_days` - Cambiar de `NOT NULL` a `NULL`

---

## 📋 MIGRACIÓN SQL

```sql
-- Make billing_cycle nullable
ALTER TABLE clients 
MODIFY COLUMN billing_cycle ENUM('monthly', 'quarterly', 'yearly', 'custom') NULL;

-- Make reminder_days nullable
ALTER TABLE clients 
MODIFY COLUMN reminder_days INT NULL;
```

---

## 🛠️ CÓMO EJECUTAR LA MIGRACIÓN

### Opción 1: Usando TablePlus (Recomendado)

1. Abrir TablePlus
2. Conectar a la base de datos de Railway
3. Abrir el archivo `migrations/make_billing_fields_nullable.sql`
4. Ejecutar las queries una por una
5. Verificar con `DESCRIBE clients;`

### Opción 2: Usando Railway CLI

```bash
# Conectar a la base de datos
railway connect mysql

# Ejecutar la migración
mysql> source migrations/make_billing_fields_nullable.sql
```

### Opción 3: Usando MySQL CLI

```bash
# Conectar con las credenciales de Railway
mysql -h <host> -u <user> -p<password> <database>

# Ejecutar la migración
mysql> ALTER TABLE clients MODIFY COLUMN billing_cycle ENUM('monthly', 'quarterly', 'yearly', 'custom') NULL;
mysql> ALTER TABLE clients MODIFY COLUMN reminder_days INT NULL;
```

---

## 🧪 VERIFICACIÓN

Después de ejecutar la migración, verificar que los campos sean nullable:

```sql
DESCRIBE clients;
```

**Resultado esperado:**

| Field | Type | Null | Key | Default | Extra |
|-------|------|------|-----|---------|-------|
| billing_cycle | enum('monthly','quarterly','yearly','custom') | **YES** | | NULL | |
| reminder_days | int | **YES** | | NULL | |

---

## ✅ RESULTADO ESPERADO

Después de la migración:

1. ✅ Clientes **NO recurrentes** se pueden crear con `billing_cycle = NULL`
2. ✅ Clientes **recurrentes** siguen funcionando con valores normales
3. ✅ Sin cambios en el código (ya está preparado)
4. ✅ Sin impacto en datos existentes

---

## 📝 NOTAS

- **Seguridad:** Esta migración es segura, no elimina datos
- **Reversible:** Se puede revertir cambiando `NULL` a `NOT NULL DEFAULT 'monthly'`
- **Impacto:** Ninguno en clientes existentes
- **Tiempo:** < 1 segundo

---

## 🚨 IMPORTANTE

**Esta migración DEBE ejecutarse ANTES de probar la creación de clientes no recurrentes.**

Sin esta migración, el sistema seguirá fallando con el error de columna NULL.

---

## 📞 PRÓXIMOS PASOS

1. ✅ Ejecutar la migración en la base de datos
2. ✅ Verificar con `DESCRIBE clients`
3. ✅ Probar crear cliente NO recurrente
4. ✅ Verificar que funcione correctamente
