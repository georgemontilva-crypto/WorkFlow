# 🚀 Guía Completa de Despliegue en Railway - WorkFlow

## ✅ Cambios Realizados

### 1. **Eliminación de Dependencias de Manus OAuth**

Se eliminó completamente la dependencia de Manus OAuth y se configuró el sistema para usar autenticación propia con email/password.

**Archivos modificados:**
- `client/src/const.ts` - Simplificado para retornar `/login` en lugar de URL de OAuth
- `server/_core/index.ts` - Las rutas de OAuth ya estaban comentadas (línea 36-37)

### 2. **Sistema de Autenticación JWT Completo**

El proyecto ya incluye un sistema de autenticación completo:

✅ **Backend (Servidor):**
- `server/_core/auth.ts` - Funciones de JWT y bcrypt
- `server/db.ts` - Funciones de base de datos para usuarios
- `server/routers.ts` - Endpoints de signup, login, logout

✅ **Frontend (Cliente):**
- `client/src/pages/Login.tsx` - Página de inicio de sesión
- `client/src/pages/Signup.tsx` - Página de registro
- `client/src/_core/hooks/useAuth.ts` - Hook de autenticación

### 3. **Base de Datos MySQL**

Todas las tablas están creadas y funcionando correctamente:

- ✅ `user` - Usuarios con password_hash
- ✅ `clients` - Gestión de clientes
- ✅ `invoices` - Facturas
- ✅ `transactions` - Ingresos y gastos
- ✅ `savings_goals` - Metas de ahorro
- ✅ `support_tickets` - Tickets de soporte
- ✅ `support_messages` - Mensajes de soporte

---

## 🔧 Configuración de Variables de Entorno en Railway

### Variables Requeridas:

```bash
# Base de datos MySQL (Railway genera esto automáticamente)
DATABASE_URL=mysql://user:password@host:port/database

# JWT Secret (genera uno aleatorio y seguro)
JWT_SECRET=tu-clave-secreta-super-segura-cambiala-en-produccion

# Encryption Key (opcional, usa JWT_SECRET si no se define)
ENCRYPTION_KEY=tu-clave-de-encriptacion-cambiala-en-produccion

# Entorno de Node
NODE_ENV=production

# Puerto (Railway lo asigna automáticamente, pero puedes definir 3000 por defecto)
PORT=3000
```

### 📝 Cómo Agregar Variables en Railway:

1. Ve a tu proyecto en Railway
2. Haz clic en tu servicio "WorkFlow"
3. Ve a la pestaña **"Variables"**
4. Agrega cada variable con su valor
5. Haz clic en **"Deploy"** para aplicar los cambios

---

## 🚀 Pasos para Desplegar en Railway

### Paso 1: Verificar que la Base de Datos MySQL esté Conectada

Si ya tienes un servicio MySQL en Railway:
1. Copia el valor de `DATABASE_URL` del servicio MySQL
2. Pégalo en las variables de entorno de tu servicio WorkFlow

Si NO tienes MySQL:
1. Haz clic en **"+ New"** en tu proyecto
2. Selecciona **"Database"** → **"Add MySQL"**
3. Railway creará automáticamente la base de datos
4. Copia el `DATABASE_URL` y agrégalo a las variables de WorkFlow

### Paso 2: Configurar Variables de Entorno

Agrega las siguientes variables en Railway:

```bash
DATABASE_URL=<copia-desde-tu-servicio-mysql>
JWT_SECRET=hiwork-jwt-secret-2024-change-in-production
ENCRYPTION_KEY=hiwork-encryption-2024-change-in-production
NODE_ENV=production
PORT=3000
```

**⚠️ IMPORTANTE:** Genera claves seguras para `JWT_SECRET` y `ENCRYPTION_KEY` en producción. Puedes usar:
```bash
# En tu terminal local:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Paso 3: Configurar Comandos de Build y Start

En Railway, ve a **Settings** → **Deploy**:

- **Build Command:** `pnpm install && pnpm build`
- **Start Command:** `node dist/index.js`

### Paso 4: Hacer Push de los Cambios

```bash
cd /home/ubuntu/WorkFlow

# Agregar todos los cambios
git add .

# Hacer commit
git commit -m "Fix: Remove Manus OAuth dependency, use JWT auth"

# Hacer push a GitHub
git push origin main
```

Railway detectará automáticamente el push y comenzará el despliegue.

### Paso 5: Verificar el Despliegue

1. Ve a la pestaña **"Deployments"** en Railway
2. Espera a que el estado sea **"Success"** (2-5 minutos)
3. Haz clic en el dominio público generado
4. ¡Tu aplicación está en vivo!

---

## 🧪 Pruebas Realizadas

### ✅ Test de Conexión a Base de Datos
```bash
node test-db-connection.mjs
```
**Resultado:** ✅ Conexión exitosa, 8 tablas encontradas

### ✅ Test de Autenticación
```bash
npx tsx test-auth.mjs
```
**Resultado:** ✅ Todos los tests pasaron
- Registro de usuarios
- Hash de contraseñas
- Login con credenciales válidas
- Rechazo de credenciales inválidas
- Generación de JWT
- Verificación de JWT

### ✅ Test del Servidor
```bash
pnpm dev
```
**Resultado:** ✅ Servidor corriendo en http://localhost:3000/

---

## 📋 Estructura del Proyecto

```
WorkFlow/
├── client/                 # Frontend (React + Vite)
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Login.tsx          # ✅ Página de login
│   │   │   ├── Signup.tsx         # ✅ Página de registro
│   │   │   ├── Home.tsx           # Dashboard
│   │   │   ├── Clients.tsx        # Gestión de clientes
│   │   │   ├── Invoices.tsx       # Gestión de facturas
│   │   │   ├── Finances.tsx       # Finanzas
│   │   │   └── Savings.tsx        # Metas de ahorro
│   │   ├── _core/
│   │   │   └── hooks/
│   │   │       └── useAuth.ts     # ✅ Hook de autenticación
│   │   └── const.ts               # ✅ Constantes (sin OAuth)
│
├── server/                 # Backend (Express + tRPC)
│   ├── _core/
│   │   ├── auth.ts                # ✅ JWT y bcrypt
│   │   ├── context.ts             # ✅ Contexto de tRPC con JWT
│   │   ├── index.ts               # ✅ Servidor Express
│   │   └── env.ts                 # Variables de entorno
│   ├── db.ts                      # ✅ Funciones de base de datos
│   └── routers.ts                 # ✅ Rutas de API (signup, login, logout)
│
├── drizzle/                # Schema y migraciones
│   ├── schema.ts                  # ✅ Definición de tablas
│   └── 0000_far_nebula.sql        # ✅ Migración SQL
│
├── .env                    # ✅ Variables de entorno (local)
├── .env.example            # ✅ Ejemplo de variables
├── test-db-connection.mjs  # ✅ Script de prueba de DB
└── test-auth.mjs           # ✅ Script de prueba de auth
```

---

## 🔐 Flujo de Autenticación

### Registro (Signup):
1. Usuario completa el formulario en `/signup`
2. Frontend envía `name`, `email`, `password` a `auth.signup`
3. Backend hashea la contraseña con bcrypt (12 rounds)
4. Backend crea el usuario en la tabla `user`
5. Backend genera un JWT token
6. Backend establece una cookie `auth_token` (7 días)
7. Usuario es redirigido al dashboard

### Login:
1. Usuario completa el formulario en `/login`
2. Frontend envía `email`, `password` a `auth.login`
3. Backend verifica las credenciales con bcrypt
4. Backend genera un JWT token
5. Backend establece una cookie `auth_token` (7 días)
6. Usuario es redirigido al dashboard

### Logout:
1. Usuario hace clic en "Logout"
2. Frontend llama a `auth.logout`
3. Backend limpia la cookie `auth_token`
4. Usuario es redirigido a `/login`

### Protección de Rutas:
- El middleware `createContext` en `server/_core/context.ts` extrae el token JWT
- Verifica el token y obtiene el usuario de la base de datos
- Las rutas protegidas usan `protectedProcedure` que requiere autenticación

---

## 🐛 Solución de Problemas

### Error: "Cannot connect to database"
**Solución:**
- Verifica que `DATABASE_URL` esté correctamente configurada en Railway
- Asegúrate de que el servicio MySQL esté corriendo
- Prueba la conexión con: `node test-db-connection.mjs`

### Error: "JWT verification failed"
**Solución:**
- Verifica que `JWT_SECRET` sea el mismo en todas las instancias
- Asegúrate de que no haya espacios al inicio o final del valor
- Genera una nueva clave si es necesario

### Error: "User not found" después de login
**Solución:**
- Verifica que la tabla `user` exista: `node test-db-connection.mjs`
- Prueba crear un usuario: `npx tsx test-auth.mjs`
- Revisa los logs del servidor para ver errores específicos

### Error: "Port already in use"
**Solución:**
- Railway asigna automáticamente el puerto
- No necesitas configurar `PORT` manualmente en producción
- En desarrollo local, cambia el puerto en `.env`

---

## 📊 Monitoreo y Logs

### Ver logs en Railway:
1. Ve a tu servicio en Railway
2. Haz clic en la pestaña **"Logs"**
3. Verás todos los logs en tiempo real

### Logs importantes a buscar:
- `Server running on http://localhost:XXXX/` - Servidor iniciado correctamente
- `[Database] Failed to...` - Errores de base de datos
- `[Auth] Token verification failed` - Errores de autenticación

---

## 🎯 Próximos Pasos

1. ✅ **Desplegar en Railway** siguiendo esta guía
2. 🔒 **Configurar HTTPS** (Railway lo hace automáticamente)
3. 🌐 **Configurar dominio personalizado** (opcional)
4. 📧 **Agregar verificación de email** (opcional)
5. 🔐 **Habilitar 2FA** (ya está implementado en el código)
6. 💳 **Integrar Stripe** para pagos (opcional)

---

## 📞 Soporte

Si tienes problemas durante el despliegue:

1. Revisa los logs en Railway
2. Ejecuta los scripts de prueba localmente
3. Verifica que todas las variables de entorno estén configuradas
4. Asegúrate de que la base de datos MySQL esté corriendo

---

## ✨ Resumen de Cambios

| Antes | Después |
|-------|---------|
| ❌ Dependía de Manus OAuth | ✅ Autenticación propia con JWT |
| ❌ Variables de entorno no definidas | ✅ `.env.example` creado |
| ❌ No había tests | ✅ Tests de DB y Auth creados |
| ❌ Documentación desactualizada | ✅ Guía completa de despliegue |

---

**¡Tu aplicación está lista para producción!** 🚀
