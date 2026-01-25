# 🔧 Migración: Simplificar Tabla Clients

**IMPORTANTE:** Esta migración es **OBLIGATORIA** antes de usar el nuevo sistema simplificado.

---

## 🎯 OBJETIVO

Eliminar todos los campos de billing que causan problemas y dejar solo los campos esenciales.

---

## 📋 MIGRACIÓN SQL

Ejecuta estas queries en TablePlus o Railway:

```sql
-- 1. Eliminar columnas de billing
ALTER TABLE clients DROP COLUMN IF EXISTS has_recurring_billing;
ALTER TABLE clients DROP COLUMN IF EXISTS billing_cycle;
ALTER TABLE clients DROP COLUMN IF EXISTS custom_cycle_days;
ALTER TABLE clients DROP COLUMN IF EXISTS amount;
ALTER TABLE clients DROP COLUMN IF EXISTS next_payment_date;
ALTER TABLE clients DROP COLUMN IF EXISTS reminder_days;
ALTER TABLE clients DROP COLUMN IF EXISTS currency;

-- 2. Hacer phone opcional
ALTER TABLE clients MODIFY COLUMN phone VARCHAR(50) NULL;

-- 3. Verificar estructura final
DESCRIBE clients;
```

---

## ✅ ESTRUCTURA FINAL ESPERADA

Después de la migración, la tabla debe tener **SOLO** estas columnas:

| Campo | Tipo | Null | Default |
|-------|------|------|---------|
| id | bigint unsigned | NO | auto_increment |
| user_id | int | NO | |
| name | varchar(255) | NO | |
| email | varchar(320) | NO | |
| phone | varchar(50) | YES | NULL |
| company | varchar(255) | YES | NULL |
| status | enum('active','inactive') | NO | 'active' |
| archived | tinyint(1) | NO | 0 |
| notes | text | YES | NULL |
| created_at | timestamp | NO | CURRENT_TIMESTAMP |
| updated_at | timestamp | NO | CURRENT_TIMESTAMP |

**Total: 11 columnas**

---

## 🚨 ADVERTENCIAS

1. **ESTA MIGRACIÓN ELIMINA DATOS DE BILLING**
   - Si tienes clientes con información de billing, se perderá
   - Haz un backup antes si es necesario

2. **NO HAY VUELTA ATRÁS**
   - Una vez ejecutada, no puedes recuperar los datos eliminados
   - Asegúrate de que realmente quieres simplificar el sistema

3. **DEPLOYMENT AUTOMÁTICO**
   - Railway ya está deployando el código nuevo
   - Espera 2-3 minutos después de ejecutar la migración

---

## 🛠️ PASOS

1. **Abrir TablePlus**
2. **Conectar a la base de datos de Finwrk**
3. **Copiar y pegar las queries de arriba**
4. **Ejecutar una por una**
5. **Verificar con `DESCRIBE clients;`**
6. **Esperar 2-3 minutos para que Railway termine el deployment**
7. **Probar crear cliente: Andres Tobon**

---

## ✅ RESULTADO

Después de la migración y el deployment:

- ✅ Sistema ultra-simple con solo campos esenciales
- ✅ Sin errores de NULL
- ✅ Sin complejidad de billing
- ✅ Formulario limpio con solo 6 campos
- ✅ Creación de clientes funcional y predecible

---

**¿Listo para ejecutar la migración?**
