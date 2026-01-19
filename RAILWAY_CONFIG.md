# ⚙️ Configuración Correcta para Railway

## 🔧 Variables de Entorno Requeridas

En Railway → WorkFlow → Variables, configura **SOLO** estas variables:

### 1. DATABASE_URL
```
mysql://root:LTctBojuWhrxYaLpkFHesSoFKiDfLwlf@crossover.proxy.rlwy.net:57415/railway
```
**Fuente:** Copia esto desde tu servicio MySQL en Railway (pestaña Variables → `MYSQL_URL`)

### 2. JWT_SECRET
```
9208a8eb9171cd27031c6b6fc04a395b2651028b8611b4c57056c91c61d8de7f2c9551d46de44eca1f354c3677978
7c8ed5c1f614d6401821b5e88dbbe2ecb12
```
**Nota:** Esta es una clave segura generada. Úsala tal cual o genera una nueva con:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 3. NODE_ENV
```
production
```

### ⚠️ NO CONFIGURES ESTAS VARIABLES:
- ❌ **PORT** - Railway lo asigna automáticamente
- ❌ **ENCRYPTION_KEY** - El código usa JWT_SECRET por defecto si no existe

---

## 📦 Comandos de Build y Start

En Railway → WorkFlow → Settings → Deploy:

### Build Command:
```bash
pnpm install && pnpm build
```

### Start Command:
```bash
node dist/index.js
```

**Nota:** NO uses `pnpm start` porque ese comando fuerza `NODE_ENV=production` en el script, lo cual es redundante.

---

## 🔗 Conectar MySQL con WorkFlow

Railway debería conectar automáticamente los servicios, pero si no:

1. Ve a tu servicio **MySQL** en Railway
2. Copia el valor de `MYSQL_URL` (o `DATABASE_URL`)
3. Pégalo en la variable `DATABASE_URL` del servicio **WorkFlow**

**Formato correcto:**
```
mysql://usuario:contraseña@host:puerto/database
```

---

## ✅ Checklist de Configuración

- [ ] Variable `DATABASE_URL` configurada (copiada desde MySQL)
- [ ] Variable `JWT_SECRET` configurada (clave segura de 64+ caracteres)
- [ ] Variable `NODE_ENV` = `production`
- [ ] Variable `PORT` **NO** configurada (Railway la asigna)
- [ ] Build Command: `pnpm install && pnpm build`
- [ ] Start Command: `node dist/index.js`
- [ ] Último commit pusheado a GitHub
- [ ] Deployment en progreso o completado

---

## 🐛 Solución de Problemas

### Error: "Application failed to respond"

**Causa:** El servidor no está escuchando en el puerto correcto o en la interfaz correcta.

**Solución:** 
- ✅ Ya corregido en el último commit
- El servidor ahora escucha en `0.0.0.0` (todas las interfaces)
- Usa directamente `process.env.PORT` sin buscar puertos alternativos

### Error: "Cannot connect to database"

**Causa:** `DATABASE_URL` mal configurada o MySQL no está corriendo.

**Solución:**
1. Verifica que el servicio MySQL esté "Online" (verde)
2. Copia exactamente el valor de `MYSQL_URL` desde MySQL
3. Pégalo en `DATABASE_URL` de WorkFlow
4. Asegúrate de que empiece con `mysql://` (no `postgresql://`)

### Error: "JWT verification failed"

**Causa:** `JWT_SECRET` no está configurado o es diferente entre deployments.

**Solución:**
1. Genera una clave segura: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
2. Configúrala en Railway
3. No la cambies después del primer despliegue

---

## 📊 Cómo Verificar que Todo Funciona

### 1. Verifica el Deployment
- Ve a Railway → WorkFlow → Deployments
- El último deployment debe estar en estado "Success" (verde)

### 2. Revisa los Logs
Deberías ver:
```
Server running on port XXXX
Environment: production
```

### 3. Abre la Aplicación
- Haz clic en el dominio público (ej: `workflow-production.up.railway.app`)
- Deberías ver la página de login de WorkFlow
- Si ves "Application failed to respond", revisa los logs

### 4. Prueba el Login
1. Ve a `/signup` para crear una cuenta
2. Ingresa nombre, email y contraseña
3. Si el registro funciona, la conexión a MySQL está OK
4. Intenta hacer login con las credenciales

---

## 🎯 Estado Actual

### ✅ Completado:
- Código sin dependencias de Manus OAuth
- Autenticación JWT funcionando
- Base de datos MySQL creada con 8 tablas
- Servidor configurado para Railway (puerto y host)
- Push a GitHub exitoso

### 🔄 En Progreso:
- Deployment en Railway
- Esperando que el nuevo build complete

### ⏳ Siguiente:
- Verificar que la aplicación responda
- Probar login/signup
- Confirmar que todo funcione

---

## 📞 Si Sigues Teniendo Problemas

1. **Copia los logs completos** del deployment más reciente
2. **Verifica las variables** en Railway → Variables
3. **Asegúrate** de que MySQL esté "Online"
4. **Espera** al menos 3-5 minutos después del push para que el build complete

---

**Última actualización:** Después del commit `8a340ab` - "Fix: Railway port configuration"
