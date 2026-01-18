# Guía Completa: Desplegar WorkFlow en Railway con PostgreSQL

## Paso 1: Crear Base de Datos PostgreSQL en Railway

1. **Ir a tu proyecto en Railway** (ya lo tienes abierto en https://railway.com)

2. **Agregar PostgreSQL:**
   - Haz clic en el botón **"+ New"** en tu proyecto
   - Selecciona **"Database"**
   - Elige **"Add PostgreSQL"**
   - Railway creará automáticamente una base de datos PostgreSQL

3. **Obtener la URL de conexión:**
   - Haz clic en el servicio PostgreSQL que acabas de crear
   - Ve a la pestaña **"Variables"**
   - Copia el valor de `DATABASE_URL` (se ve así: `postgresql://usuario:contraseña@host:puerto/database`)

## Paso 2: Configurar Variables de Entorno en Railway

1. **Ir al servicio WorkFlow:**
   - Haz clic en tu servicio "WorkFlow" en Railway
   - Ve a la pestaña **"Variables"**

2. **Agregar las siguientes variables de entorno:**

```
DATABASE_URL=postgresql://usuario:contraseña@host:puerto/database
NODE_ENV=production
PORT=3000
```

**Importante:** Reemplaza el valor de `DATABASE_URL` con el que copiaste del servicio PostgreSQL.

## Paso 3: Configurar el Despliegue

1. **Verificar que el repositorio esté conectado:**
   - En la pestaña **"Settings"** de tu servicio WorkFlow
   - Verifica que esté conectado a `georgemontilva-crypto/WorkFlow`

2. **Configurar el comando de inicio:**
   - En **"Settings"** → **"Deploy"**
   - **Build Command:** `pnpm install && pnpm build`
   - **Start Command:** `node dist/index.js`

3. **Configurar el dominio público:**
   - En **"Settings"** → **"Networking"**
   - Railway generará automáticamente un dominio público (ej: `workflow-production.up.railway.app`)

## Paso 4: Crear las Tablas en la Base de Datos

Hay dos opciones para crear las tablas:

### Opción A: Desde tu computadora local (Recomendado)

1. **Crear archivo `.env` local con la DATABASE_URL de Railway:**
```bash
echo "DATABASE_URL=postgresql://usuario:contraseña@host:puerto/database" > .env
```

2. **Ejecutar las migraciones:**
```bash
cd /home/ubuntu/WorkFlow
pnpm db:push
```

Este comando creará todas las tablas (clients, invoices, transactions, savingsGoals, user) en tu base de datos de Railway.

### Opción B: Conectarse directamente a PostgreSQL

Si prefieres usar un cliente de PostgreSQL (como pgAdmin, DBeaver, o psql):

1. **Conectarse con las credenciales de Railway**
2. **Ejecutar el siguiente SQL:**

```sql
-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS user (
  id SERIAL PRIMARY KEY,
  open_id VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  avatar VARCHAR(500),
  role VARCHAR(50) DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de clientes
CREATE TABLE IF NOT EXISTS clients (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  amount DECIMAL(10, 2) NOT NULL,
  frequency VARCHAR(50) NOT NULL,
  next_payment_date DATE NOT NULL,
  reminder_days INTEGER DEFAULT 3,
  status VARCHAR(50) DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de facturas
CREATE TABLE IF NOT EXISTS invoices (
  id SERIAL PRIMARY KEY,
  invoice_number VARCHAR(100) UNIQUE NOT NULL,
  client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
  issue_date DATE NOT NULL,
  due_date DATE NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  paid_amount DECIMAL(10, 2) DEFAULT 0,
  status VARCHAR(50) DEFAULT 'pending',
  notes TEXT,
  items JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de transacciones
CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  type VARCHAR(50) NOT NULL,
  category VARCHAR(100) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de metas de ahorro
CREATE TABLE IF NOT EXISTS savings_goals (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  target_amount DECIMAL(10, 2) NOT NULL,
  current_amount DECIMAL(10, 2) DEFAULT 0,
  deadline DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
```

## Paso 5: Login y Registro con Manus OAuth

**¡Buenas noticias!** El login y registro ya están completamente configurados con **Manus OAuth**. No necesitas hacer nada adicional.

### Cómo funciona:

1. **Los usuarios hacen clic en "Login"** → Son redirigidos a Manus OAuth
2. **Inician sesión con su cuenta de Manus** (o crean una nueva)
3. **Son redirigidos de vuelta a tu aplicación** ya autenticados
4. **Su información se guarda automáticamente** en la tabla `user`

### Variables de OAuth (ya configuradas automáticamente por Manus):

- `OAUTH_SERVER_URL`
- `VITE_OAUTH_PORTAL_URL`
- `VITE_APP_ID`
- `JWT_SECRET`

Estas variables se inyectan automáticamente cuando despliegas en Railway desde Manus.

## Paso 6: Desplegar la Aplicación

1. **Hacer push de los cambios a GitHub:**
```bash
cd /home/ubuntu/WorkFlow
git add .
git commit -m "Configurar para despliegue en Railway"
git push origin main
```

2. **Railway desplegará automáticamente:**
   - Detecta el push a GitHub
   - Ejecuta `pnpm install && pnpm build`
   - Inicia la aplicación con `node dist/index.js`

3. **Esperar a que el despliegue termine:**
   - Ve a la pestaña **"Deployments"** en Railway
   - Espera a que el estado sea **"Success"** (toma 2-5 minutos)

4. **Acceder a tu aplicación:**
   - Haz clic en el dominio público generado por Railway
   - ¡Tu aplicación está en vivo!

## Paso 7: Verificar que Todo Funciona

1. **Probar el login:**
   - Haz clic en "Login" en tu aplicación
   - Inicia sesión con tu cuenta de Manus
   - Verifica que seas redirigido correctamente

2. **Probar las funcionalidades:**
   - Crear un cliente
   - Crear una factura
   - Verificar que los datos se guardan en PostgreSQL

## Solución de Problemas Comunes

### Error: "Cannot connect to database"
- Verifica que `DATABASE_URL` esté correctamente configurada en Railway
- Asegúrate de que el servicio PostgreSQL esté corriendo

### Error: "Table does not exist"
- Ejecuta `pnpm db:push` para crear las tablas
- O ejecuta el SQL manualmente en PostgreSQL

### Error: "OAuth redirect failed"
- Verifica que las variables de OAuth estén configuradas
- Contacta a soporte de Manus si persiste el problema

## Recursos Adicionales

- **Railway Docs:** https://docs.railway.app/
- **PostgreSQL Docs:** https://www.postgresql.org/docs/
- **Manus OAuth Docs:** https://docs.manus.im/oauth

---

**¿Necesitas ayuda?** Contáctame y te ayudo con cualquier paso que no esté claro.
