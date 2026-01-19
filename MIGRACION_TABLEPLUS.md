# 🗄️ Migración con TablePlus - Agregar trial_ends_at

## 📋 Pasos Rápidos

### 1️⃣ Conectar a tu Base de Datos Railway

En TablePlus:

1. **Crea nueva conexión** (botón "+" o Cmd+N)
2. Selecciona **MySQL**
3. **Completa los datos de Railway:**

Obtén estos datos de Railway → MySQL → Variables:

```
Host: mysql.railway.internal (o la IP pública)
Port: 3306
User: root
Password: [tu password de MYSQLPASSWORD]
Database: railway
```

4. Haz clic en **"Test"** para verificar
5. Haz clic en **"Connect"**

---

### 2️⃣ Ejecutar la Migración

Una vez conectado:

1. **Presiona Cmd+K** (o clic en el icono SQL)
2. **Copia y pega este SQL:**

```sql
-- Agregar campo trial_ends_at
ALTER TABLE `user` 
ADD COLUMN `trial_ends_at` TIMESTAMP NULL;

-- Configurar trial para usuarios existentes
UPDATE `user` 
SET `trial_ends_at` = DATE_ADD(`created_at`, INTERVAL 7 DAY)
WHERE `trial_ends_at` IS NULL;
```

3. **Presiona Cmd+Enter** para ejecutar
4. Deberías ver: ✅ "Query OK, X rows affected"

---

### 3️⃣ Verificar que Funcionó

Ejecuta esta consulta:

```sql
SELECT id, name, email, trial_ends_at, has_lifetime_access 
FROM `user` 
LIMIT 10;
```

**Resultado esperado:**
- Deberías ver la columna `trial_ends_at` con fechas
- Las fechas deben ser ~7 días después de `created_at`

---

## 🎯 Datos de Conexión Railway

### Dónde Encontrar los Datos

1. **Abre Railway** → Tu proyecto
2. **Haz clic en MySQL** (tu base de datos)
3. **Ve a "Variables"**
4. **Copia estos valores:**

| Variable Railway | Campo TablePlus |
|------------------|-----------------|
| `MYSQLHOST` | Host |
| `MYSQLPORT` | Port (3306) |
| `MYSQLUSER` | User (root) |
| `MYSQLPASSWORD` | Password |
| `MYSQLDATABASE` | Database (railway) |

### Ejemplo de Conexión

```
Name: WorkFlow Railway
Host: mysql.railway.internal
Port: 3306
User: root
Password: LTctBojuWhrxYaLpkFHesSofK1DfLwlf
Database: railway
```

---

## 📸 Capturas de Referencia

### Paso 1: Nueva Conexión
```
TablePlus → Cmd+N → MySQL
```

### Paso 2: Llenar Datos
```
[Formulario con campos de Railway]
```

### Paso 3: Ejecutar SQL
```
Cmd+K → Pegar SQL → Cmd+Enter
```

---

## ✅ Verificación Final

Después de ejecutar la migración:

### 1. En TablePlus

Verifica la estructura de la tabla:

```sql
DESCRIBE `user`;
```

Deberías ver `trial_ends_at` en la lista de columnas.

### 2. En tu Aplicación

1. Ve a `https://hiwork.site/signup`
2. Crea una cuenta nueva
3. ✅ Debe funcionar sin errores
4. ✅ Verás el popup de bienvenida
5. ✅ Verás el contador de días en el dashboard

---

## 🚨 Solución de Problemas

### Error: "Can't connect to MySQL server"

**Causa:** Railway usa host interno, necesitas la IP pública.

**Solución:**
1. En Railway → MySQL → Settings
2. Busca "Public Networking"
3. Usa `MYSQL_PUBLIC_URL` en lugar de `MYSQL_URL`
4. Formato: `mysql://user:pass@host:port/database`

### Error: "Column 'trial_ends_at' already exists"

**Solución:** La migración ya está aplicada, solo ejecuta el UPDATE:

```sql
UPDATE `user` 
SET `trial_ends_at` = DATE_ADD(`created_at`, INTERVAL 7 DAY)
WHERE `trial_ends_at` IS NULL;
```

### Error: "Access denied"

**Solución:** Verifica que estás usando el password correcto de `MYSQLPASSWORD`.

---

## 📝 SQL Completo (Copia y Pega)

```sql
-- ========================================
-- Migración: Agregar trial_ends_at
-- ========================================

-- 1. Agregar columna
ALTER TABLE `user` 
ADD COLUMN `trial_ends_at` TIMESTAMP NULL;

-- 2. Actualizar usuarios existentes
UPDATE `user` 
SET `trial_ends_at` = DATE_ADD(`created_at`, INTERVAL 7 DAY)
WHERE `trial_ends_at` IS NULL;

-- 3. Verificar resultado
SELECT 
    id,
    name,
    email,
    created_at,
    trial_ends_at,
    DATEDIFF(trial_ends_at, NOW()) as days_remaining,
    has_lifetime_access
FROM `user`
ORDER BY created_at DESC
LIMIT 10;
```

---

## ⏱️ Tiempo Estimado

- **Conexión:** 2 minutos
- **Ejecución:** 10 segundos
- **Verificación:** 1 minuto
- **Total:** ~3 minutos

---

## ✅ Checklist

- [ ] Abrir TablePlus
- [ ] Crear conexión a Railway MySQL
- [ ] Probar conexión (Test)
- [ ] Conectar
- [ ] Abrir SQL Query (Cmd+K)
- [ ] Pegar SQL de migración
- [ ] Ejecutar (Cmd+Enter)
- [ ] Verificar con SELECT
- [ ] Probar crear cuenta en hiwork.site
- [ ] ✅ Todo funcionando

---

**¡Listo!** Una vez ejecutada la migración en TablePlus, podrás crear cuentas sin problemas. 🎉
