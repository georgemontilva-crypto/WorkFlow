# Guía de Despliegue en Railway - HiWork

Esta guía te ayudará a desplegar tu aplicación HiWork en Railway con PostgreSQL.

---

## 📋 Prerrequisitos

1. **Cuenta en Railway**: Crea una cuenta gratuita en [railway.app](https://railway.app)
2. **Repositorio en GitHub**: El código ya está en `georgemontilva-crypto/WorkFlow`
3. **Base de datos PostgreSQL**: Ya configurada en Railway (ballast.proxy.rlwy.net:14641)

---

## 🚀 Pasos de Despliegue

### 1. Crear Nuevo Proyecto en Railway

1. Ve a [railway.app](https://railway.app) e inicia sesión
2. Haz clic en **"New Project"**
3. Selecciona **"Deploy from GitHub repo"**
4. Busca y selecciona el repositorio `georgemontilva-crypto/WorkFlow`
5. Railway detectará automáticamente que es un proyecto Node.js

### 2. Configurar Variables de Entorno

En el panel de Railway, ve a la pestaña **"Variables"** y agrega las siguientes variables:

#### Variables de Base de Datos (Ya configuradas)
```
DATABASE_URL=postgresql://postgres:xxxxxxx@ballast.proxy.rlwy.net:14641/railway
```

#### Variables de Manus OAuth (Sistema)
Estas variables ya están configuradas automáticamente por Manus:
- `JWT_SECRET`
- `OAUTH_SERVER_URL`
- `VITE_OAUTH_PORTAL_URL`
- `VITE_APP_ID`
- `OWNER_OPEN_ID`
- `OWNER_NAME`
- `BUILT_IN_FORGE_API_KEY`
- `BUILT_IN_FORGE_API_URL`
- `VITE_FRONTEND_FORGE_API_KEY`
- `VITE_FRONTEND_FORGE_API_URL`
- `VITE_ANALYTICS_ENDPOINT`
- `VITE_ANALYTICS_WEBSITE_ID`

#### Variables de Aplicación
```
NODE_ENV=production
VITE_APP_TITLE=HiWork
VITE_APP_LOGO=/hiwork-icon.png
```

### 3. Configurar Build Settings

Railway debería detectar automáticamente la configuración, pero verifica:

**Build Command:**
```bash
pnpm install && pnpm build
```

**Start Command:**
```bash
pnpm start
```

**Install Command:**
```bash
pnpm install
```

### 4. Configurar Puerto

Railway asigna automáticamente un puerto. Asegúrate de que tu aplicación escuche en el puerto proporcionado por la variable `PORT`:

```javascript
const PORT = process.env.PORT || 3000;
```

Esto ya está configurado en `server/_core/index.ts`.

### 5. Verificar Base de Datos

Las tablas ya están creadas en la base de datos PostgreSQL. Puedes verificarlo conectándote con:

```bash
psql postgresql://postgres:xxxxxxx@ballast.proxy.rlwy.net:14641/railway
```

Tablas existentes:
- `user` (8 columnas + índices)
- `clients` (13 columnas + índices)
- `invoices` (12 columnas + índices)
- `transactions` (7 columnas + índices)
- `savings_goals` (7 columnas + índices)

### 6. Desplegar

1. Railway iniciará el despliegue automáticamente después de configurar las variables
2. Puedes ver los logs en tiempo real en la pestaña **"Deployments"**
3. El proceso tomará aproximadamente 2-5 minutos

### 7. Obtener URL de Producción

Una vez desplegado:
1. Ve a la pestaña **"Settings"**
2. En **"Domains"**, Railway generará una URL automática como: `hiwork-production.up.railway.app`
3. Opcionalmente, puedes agregar un dominio personalizado

---

## ✅ Verificación Post-Despliegue

### 1. Verificar Login con Manus OAuth

1. Abre la URL de producción
2. Intenta iniciar sesión
3. Deberías ser redirigido al portal de Manus OAuth
4. Después del login, deberías regresar a la aplicación autenticado

### 2. Verificar Funcionalidades

- [ ] Dashboard carga correctamente
- [ ] Crear nuevo cliente funciona
- [ ] Crear nueva factura funciona
- [ ] Generar PDF de factura funciona
- [ ] Transacciones se guardan correctamente
- [ ] Metas de ahorro funcionan
- [ ] Recordatorios se muestran correctamente
- [ ] PWA se puede instalar (icono de HiWork)

### 3. Verificar Base de Datos

Conéctate a la base de datos y verifica que los datos se están guardando:

```sql
-- Verificar clientes
SELECT * FROM clients LIMIT 5;

-- Verificar facturas
SELECT * FROM invoices LIMIT 5;

-- Verificar transacciones
SELECT * FROM transactions LIMIT 5;
```

---

## 🔧 Troubleshooting

### Error: "Cannot connect to database"

**Solución:**
1. Verifica que `DATABASE_URL` esté correctamente configurada
2. Asegúrate de que la base de datos PostgreSQL esté activa en Railway
3. Verifica que el formato de la URL sea correcto:
   ```
   postgresql://user:password@host:port/database
   ```

### Error: "OAuth redirect mismatch"

**Solución:**
1. Verifica que `VITE_OAUTH_PORTAL_URL` esté configurada
2. Asegúrate de que la URL de producción esté registrada en Manus OAuth
3. Contacta al soporte de Manus si persiste el error

### Error: "Build failed"

**Solución:**
1. Verifica los logs de build en Railway
2. Asegúrate de que todas las dependencias estén en `package.json`
3. Verifica que `pnpm build` funcione localmente
4. Revisa que no haya errores de TypeScript

### Error: "Application crashed"

**Solución:**
1. Revisa los logs de runtime en Railway
2. Verifica que el comando de start sea correcto: `pnpm start`
3. Asegúrate de que el puerto esté configurado correctamente
4. Verifica que todas las variables de entorno estén configuradas

---

## 📊 Monitoreo

### Logs en Tiempo Real

Railway proporciona logs en tiempo real:
1. Ve a tu proyecto en Railway
2. Haz clic en la pestaña **"Deployments"**
3. Selecciona el deployment activo
4. Verás los logs en tiempo real

### Métricas

Railway también proporciona métricas básicas:
- CPU usage
- Memory usage
- Network traffic
- Request count

---

## 🔄 Actualizaciones Futuras

Para desplegar actualizaciones:

1. Haz cambios en tu código local
2. Commit y push a GitHub:
   ```bash
   git add .
   git commit -m "Descripción de cambios"
   git push github main
   ```
3. Railway detectará automáticamente el push y desplegará la nueva versión

---

## 🌐 Dominio Personalizado (Opcional)

Para agregar un dominio personalizado:

1. Ve a **"Settings"** → **"Domains"**
2. Haz clic en **"Add Domain"**
3. Ingresa tu dominio (ejemplo: `hiwork.com`)
4. Railway te proporcionará registros DNS para configurar
5. Agrega los registros en tu proveedor de dominio
6. Espera a que se propague (puede tomar hasta 48 horas)

---

## 📞 Soporte

- **Railway**: [docs.railway.app](https://docs.railway.app)
- **Manus**: [help.manus.im](https://help.manus.im)
- **GitHub Issues**: [github.com/georgemontilva-crypto/WorkFlow/issues](https://github.com/georgemontilva-crypto/WorkFlow/issues)

---

## 🎉 ¡Listo!

Tu aplicación HiWork debería estar ahora desplegada y funcionando en Railway. Puedes acceder a ella desde la URL proporcionada y comenzar a usarla en producción.

**Próximos pasos recomendados:**
1. Configura un dominio personalizado
2. Habilita backups automáticos de la base de datos
3. Configura alertas de monitoreo
4. Implementa CI/CD con GitHub Actions (opcional)
