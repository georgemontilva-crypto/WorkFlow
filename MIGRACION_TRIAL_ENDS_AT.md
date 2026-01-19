# 🗄️ Migración: Agregar Campo trial_ends_at

## ⚠️ Problema Identificado

Al intentar crear una cuenta nueva, aparece el error:

```
Failed query: select `id`, `name`, `email`, `password_hash`, 
`email_verified`, `login_method`, `role`, `trial_ends_at`, 
`has_lifetime_access`, ... from `user` where `user`.`email` = ?
```

**Causa:** La tabla `user` en la base de datos de Railway **no tiene el campo `trial_ends_at`**.

---

## ✅ Solución: Ejecutar Migración SQL

### Opción 1: Ejecutar SQL en Railway (Recomendado)

1. **Abre Railway** → Ve a tu proyecto **WorkFlow**
2. **Haz clic en MySQL** (tu base de datos)
3. **Ve a la pestaña "Query"** o "Data"
4. **Ejecuta este SQL:**

```sql
-- Agregar campo trial_ends_at
ALTER TABLE `user` 
ADD COLUMN `trial_ends_at` TIMESTAMP NULL;

-- Configurar trial para usuarios existentes (7 días desde registro)
UPDATE `user` 
SET `trial_ends_at` = DATE_ADD(`created_at`, INTERVAL 7 DAY)
WHERE `trial_ends_at` IS NULL;
```

5. **Verifica que funcionó:**

```sql
SELECT id, name, email, trial_ends_at, has_lifetime_access 
FROM `user` 
LIMIT 5;
```

Deberías ver el campo `trial_ends_at` con fechas.

---

### Opción 2: Usar Drizzle Kit (Alternativa)

Si tienes Drizzle Kit configurado:

```bash
cd /home/ubuntu/WorkFlow
pnpm drizzle-kit push:mysql
```

Esto sincronizará automáticamente el schema con la base de datos.

---

## 📋 Verificación

Después de ejecutar la migración, intenta crear una cuenta nueva:

1. Ve a `https://hiwork.site/signup`
2. Completa el formulario
3. Haz clic en "Create Account"
4. ✅ Debería funcionar sin errores

---

## 🔍 Qué Hace Esta Migración

### Campo Agregado

```sql
trial_ends_at TIMESTAMP NULL
```

- **Propósito:** Almacena la fecha de fin del período de prueba (7 días)
- **Tipo:** TIMESTAMP (fecha y hora)
- **Nullable:** Sí (para usuarios con acceso de por vida)

### Usuarios Existentes

La migración también actualiza usuarios existentes:

```sql
UPDATE `user` 
SET `trial_ends_at` = DATE_ADD(`created_at`, INTERVAL 7 DAY)
WHERE `trial_ends_at` IS NULL;
```

Esto da 7 días de prueba desde su fecha de registro.

---

## 🚨 Importante

**Esta migración es OBLIGATORIA** para que funcione:

- ✅ Registro de nuevos usuarios
- ✅ Popup de bienvenida
- ✅ Contador de días de prueba
- ✅ Banner de trial en dashboard

Sin esta migración, el sistema no puede crear cuentas nuevas.

---

## 📊 Campos Relacionados

Después de la migración, la tabla `user` tendrá:

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `trial_ends_at` | TIMESTAMP | Fecha de fin del trial (7 días) |
| `has_lifetime_access` | INT | 1 = acceso de por vida, 0 = trial |
| `created_at` | TIMESTAMP | Fecha de registro |

---

## 🧪 Probar Después de Migrar

### 1. Crear Cuenta Nueva
- Debe funcionar sin errores
- `trial_ends_at` debe ser 7 días después de hoy

### 2. Ver Popup de Bienvenida
- Aparece después de registrarse
- Muestra "7 días de prueba"

### 3. Ver Contador en Dashboard
- Banner muestra "Quedan 7 días de prueba"
- Color azul/verde

---

## 🆘 Si Algo Sale Mal

### Error: "Column already exists"

Si ya ejecutaste la migración antes:

```sql
-- Verificar si el campo existe
DESCRIBE `user`;
```

Si `trial_ends_at` aparece en la lista, la migración ya está aplicada.

### Error: "Access denied"

Asegúrate de tener permisos de ALTER TABLE en Railway.

### Usuarios sin trial_ends_at

Si algunos usuarios no tienen el campo después de migrar:

```sql
UPDATE `user` 
SET `trial_ends_at` = DATE_ADD(NOW(), INTERVAL 7 DAY)
WHERE `trial_ends_at` IS NULL;
```

---

## ✅ Checklist de Migración

- [ ] Abrir Railway → MySQL → Query
- [ ] Ejecutar `ALTER TABLE` para agregar campo
- [ ] Ejecutar `UPDATE` para usuarios existentes
- [ ] Verificar con `SELECT` que el campo existe
- [ ] Probar crear cuenta nueva
- [ ] Verificar popup de bienvenida
- [ ] Verificar contador en dashboard

---

**Una vez completada la migración, todo funcionará correctamente.** 🎉

El archivo SQL está en: `/migrations/add_trial_ends_at.sql`
