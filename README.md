# 💼 WorkFlow - Sistema de Gestión Empresarial

Sistema completo de gestión empresarial con autenticación JWT, gestión de clientes, facturas, finanzas y metas de ahorro.

## 🚀 Características

- ✅ **Autenticación JWT** - Sistema seguro de login/signup sin dependencias externas
- 💼 **Gestión de Clientes** - Administra tu cartera de clientes
- 📄 **Facturas** - Crea y gestiona facturas profesionales
- 💰 **Finanzas** - Controla ingresos y gastos
- 🎯 **Metas de Ahorro** - Planifica y alcanza tus objetivos financieros
- 🎫 **Sistema de Soporte** - Tickets y mensajes de soporte
- 🔐 **2FA** - Autenticación de dos factores (opcional)
- 🌙 **Tema Oscuro** - Diseño minimalista estilo Apple

## 🛠️ Stack Tecnológico

### Frontend
- **React 19** - Framework de UI
- **Vite** - Build tool ultra rápido
- **TypeScript** - Type safety
- **TailwindCSS** - Estilos utility-first
- **Wouter** - Router ligero
- **tRPC** - Type-safe API calls
- **Dexie** - IndexedDB para almacenamiento local

### Backend
- **Node.js** - Runtime
- **Express** - Web framework
- **tRPC** - Type-safe API
- **Drizzle ORM** - Type-safe SQL
- **MySQL** - Base de datos
- **JWT** - Autenticación
- **bcrypt** - Hash de contraseñas

## 📦 Instalación Local

### Requisitos
- Node.js 22+
- pnpm 10+
- MySQL 8+

### Pasos

1. **Clonar el repositorio**
```bash
git clone https://github.com/georgemontilva-crypto/WorkFlow.git
cd WorkFlow
```

2. **Instalar dependencias**
```bash
pnpm install
```

3. **Configurar variables de entorno**
```bash
cp .env.example .env
```

Edita `.env` con tus credenciales:
```bash
DATABASE_URL=mysql://user:password@localhost:3306/workflow
JWT_SECRET=tu-clave-secreta-super-segura
ENCRYPTION_KEY=tu-clave-de-encriptacion
NODE_ENV=development
PORT=3000
```

4. **Crear las tablas en la base de datos**
```bash
pnpm db:push
```

5. **Iniciar el servidor de desarrollo**
```bash
pnpm dev
```

La aplicación estará disponible en `http://localhost:3000`

## 🧪 Tests

### Test de Conexión a Base de Datos
```bash
node test-db-connection.mjs
```

### Test de Autenticación
```bash
npx tsx test-auth.mjs
```

## 🚀 Despliegue en Railway

Sigue la guía completa en [DEPLOY_RAILWAY.md](./DEPLOY_RAILWAY.md)

### Resumen rápido:

1. **Crear servicio MySQL en Railway**
2. **Configurar variables de entorno:**
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `ENCRYPTION_KEY`
   - `NODE_ENV=production`
3. **Configurar comandos:**
   - Build: `pnpm install && pnpm build`
   - Start: `node dist/index.js`
4. **Push a GitHub:**
```bash
git add .
git commit -m "Deploy to Railway"
git push origin main
```

## 📁 Estructura del Proyecto

```
WorkFlow/
├── client/              # Frontend React
│   ├── src/
│   │   ├── pages/      # Páginas de la aplicación
│   │   ├── components/ # Componentes reutilizables
│   │   ├── _core/      # Hooks y utilidades core
│   │   └── lib/        # Librerías y configuración
│
├── server/              # Backend Express
│   ├── _core/          # Core del servidor
│   ├── routers.ts      # Rutas de API (tRPC)
│   └── db.ts           # Funciones de base de datos
│
├── drizzle/            # Schema y migraciones
│   ├── schema.ts       # Definición de tablas
│   └── *.sql           # Migraciones SQL
│
└── shared/             # Código compartido
```

## 🔐 Autenticación

El sistema usa JWT (JSON Web Tokens) para autenticación:

1. **Registro:** El usuario crea una cuenta con email y contraseña
2. **Hash:** La contraseña se hashea con bcrypt (12 rounds)
3. **Token:** Se genera un JWT con 7 días de expiración
4. **Cookie:** El token se almacena en una cookie HTTP-only
5. **Verificación:** Cada request verifica el token automáticamente

## 📊 Base de Datos

### Tablas principales:

- **user** - Usuarios del sistema
- **clients** - Clientes de la empresa
- **invoices** - Facturas emitidas
- **transactions** - Ingresos y gastos
- **savings_goals** - Metas de ahorro
- **support_tickets** - Tickets de soporte
- **support_messages** - Mensajes de soporte

## 🎨 Diseño

El diseño sigue la filosofía de **Apple Minimalism**:
- Colores: Negro, grises, blanco
- Tema oscuro por defecto
- Interfaz limpia y profesional
- Mobile-first responsive

## 📝 Scripts Disponibles

```bash
pnpm dev          # Iniciar servidor de desarrollo
pnpm build        # Compilar para producción
pnpm start        # Iniciar servidor de producción
pnpm check        # Verificar tipos TypeScript
pnpm format       # Formatear código con Prettier
pnpm test         # Ejecutar tests
pnpm db:push      # Crear/actualizar tablas en DB
```

## 🔧 Configuración

### Variables de Entorno

| Variable | Descripción | Requerida |
|----------|-------------|-----------|
| `DATABASE_URL` | URL de conexión MySQL | ✅ |
| `JWT_SECRET` | Clave secreta para JWT | ✅ |
| `ENCRYPTION_KEY` | Clave para encriptación | ⚠️ (usa JWT_SECRET si no se define) |
| `NODE_ENV` | Entorno (development/production) | ✅ |
| `PORT` | Puerto del servidor | ⚠️ (default: 3000) |

## 🐛 Solución de Problemas

### Error: "Cannot connect to database"
- Verifica que MySQL esté corriendo
- Revisa la `DATABASE_URL` en `.env`
- Ejecuta `node test-db-connection.mjs`

### Error: "JWT verification failed"
- Verifica que `JWT_SECRET` sea consistente
- Limpia las cookies del navegador
- Genera una nueva clave si es necesario

### Error: "Port already in use"
- Cambia el `PORT` en `.env`
- Mata el proceso: `lsof -ti:3000 | xargs kill -9`

## 📄 Licencia

MIT

## 👥 Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📞 Soporte

Si necesitas ayuda:
- Revisa la [Guía de Despliegue](./DEPLOY_RAILWAY.md)
- Ejecuta los scripts de test
- Revisa los logs del servidor

---

**Hecho con ❤️ para gestionar tu negocio de manera eficiente**
