# HiWork Migration TODO

## Phase 1: Database Schema & tRPC Routers
- [x] Create database schema in drizzle/schema.ts (clients, invoices, transactions, savingsGoals)
- [x] Run pnpm db:push to create tables
- [x] Create database helper functions in server/db.ts
- [x] Create tRPC routers in server/routers.ts with CRUD operations

## Phase 2: Frontend Migration from Dexie to tRPC
- [x] Migrate Clients.tsx to use tRPC
- [x] Migrate Invoices.tsx to use tRPC
- [ ] Migrate Reminders.tsx to use tRPC
- [ ] Migrate Home.tsx (Dashboard) to use tRPC
- [ ] Migrate Finances.tsx to use tRPC
- [ ] Migrate Savings.tsx to use tRPC

## Phase 3: Cleanup & Rename
- [ ] Remove Dexie dependencies from package.json
- [ ] Delete client/src/lib/db.ts
- [ ] Rename project from "WorkFlow" to "HiWork" in package.json
- [ ] Update VITE_APP_TITLE to "HiWork"
- [ ] Update all references to WorkFlow in code

## Phase 4: Testing
- [ ] Test client CRUD operations
- [ ] Test invoice creation and management
- [ ] Test reminders and alerts
- [ ] Test dashboard statistics
- [ ] Test transactions and savings goals
- [ ] Verify all features work correctly

## Phase 5: GitHub & Railway Deployment
- [x] Push code to GitHub repository georgemontilva-crypto/WorkFlow
- [x] Configure Railway project
- [x] Set up PostgreSQL database on Railway
- [x] Configure environment variables
- [ ] Deploy application
- [ ] Test deployed application

## Phase 6: Delivery
- [ ] Save final checkpoint
- [ ] Document deployment process
- [ ] Provide user with access information


## Visual Defects & Invoices Repair
- [x] Identify visual defects in the application
- [x] Check and repair Invoices section (reported as broken)
- [x] Fix any styling issues caused by migration
- [x] Verify all pages display correctly
- [ ] Test responsive design on mobile and desktop


## Restore Invoices Layout
- [x] Wrap Invoices page content with DashboardLayout component
- [x] Verify sidebar navigation appears correctly
- [x] Improve visual organization and spacing to match original design
- [x] Test that all invoice functionality still works with the layout

## Create Test Data
- [x] Create sample clients in the database
- [x] Create sample invoices with different statuses
- [x] Verify statistics cards display correctly with data


## Fix Invoices UI/UX
- [x] Diagnose why invoice cards are not displaying
- [x] Redesign invoice cards layout for better visibility
- [x] Improve overall page design and spacing
- [x] Add loading states and empty states
- [x] Test responsive design on different screen sizes


## Redesign Invoices Layout (User Request)
- [x] Remove statistics cards (Total, Pendientes, Pagadas, Vencidas)
- [x] Remove "Ver Archivados" button
- [x] Move header section (title + description + New Invoice button) to top
- [x] Simplify closed invoice cards to show only invoice number and client name
- [x] Keep expanded view with vencimiento, monto, and estado


## Optimize Invoices Grid Layout
- [x] Change invoice cards layout to 3-column grid on desktop
- [x] Make grid responsive: 3 columns (desktop), 2 columns (tablet), 1 column (mobile)
- [x] Ensure cards maintain proper spacing and alignment
- [x] Test on different screen sizes


## Implement Accordion Behavior for Invoice Cards
- [x] Modify toggleCard function to close other cards when one is expanded
- [x] Change expandedCards from Set to single ID state
- [x] Test accordion behavior works correctly


## Fix Invoice Card Expansion Bug
- [x] Diagnose why all cards appear expanded when clicking one
- [x] Review toggleCard function and expandedCardId state logic
- [x] Fix the conditional rendering of expanded content
- [x] Test that only clicked card expands and others remain collapsed


## Railway Deployment Setup
- [x] Create PostgreSQL database in Railway
- [x] Get database connection string (DATABASE_URL)
- [x] Configure environment variables in Railway
- [x] Run database migrations to create tables
- [x] Push code to GitHub repository
- [x] Create comprehensive deployment guide (RAILWAY_DEPLOYMENT.md)
- [ ] Deploy application to Railway
- [ ] Verify login/registro with Manus OAuth works in production
- [ ] Test all features in production environment


## Rebrand to HiWork
- [x] Copy HiWork logos to project public folder
- [x] Update package.json name to "hiwork"
- [x] Update all "WorkFlow" references to "HiWork" in code
- [x] Configure PWA manifest with HiWork name and icon
- [x] Update favicon to HiWork logo
- [x] Update DashboardLayout header with HiWork branding
- [x] Test PWA installation with new icon


## Actualizar Logo con Icono Cuadrado y Tipografía Radeil Rounded
- [x] Extraer la tipografía Radeil Rounded del archivo ZIP
- [x] Copiar la fuente a la carpeta public/fonts
- [x] Actualizar index.css para cargar la fuente Radeil Rounded con @font-face
- [x] Copiar el nuevo icono cuadrado a la carpeta public
- [x] Actualizar DashboardLayout para usar el logo cuadrado completo (icono + texto)
- [x] Verificar que el logo se vea correctamente en sidebar y header
- [x] Guardar checkpoint con los cambios


## Sistema de Autenticación y Monetización
- [x] Actualizar esquema de base de datos (user) para incluir campos: trial_ends_at, has_lifetime_access, stripe_customer_id, stripe_payment_id
- [x] Crear landing page minimalista con información de HiWork
- [x] Implementar lógica de prueba gratuita de 7 días
- [x] Crear middleware para verificar acceso (trial activo o lifetime access)
- [x] Implementar bloqueo de funcionalidades cuando expire el trial
- [ ] Integrar Stripe para pagos (webdev_add_feature stripe)
- [ ] Crear página de pricing con opción de pago único lifetime
- [ ] Crear componente de "Upgrade to Lifetime" para usuarios con trial expirado
- [ ] Crear página de Términos de Servicio
- [ ] Crear página de Política de Privacidad
- [ ] Añadir badges de cumplimiento (GDPR, ISO, AICPA SOC, HIPAA) en footer
- [ ] Definir precio del lifetime access
- [ ] Verificar flujo completo: registro → trial → expiración → pago → acceso lifetime


## Soporte Multiidioma (Inglés/Español)
- [x] Crear contexto de idioma global para Landing page
- [x] Crear archivos de traducción (en.ts y es.ts) para Landing
- [x] Agregar selector de idioma en header de Landing
- [x] Traducir todo el contenido de Landing page
- [x] Traducir AccessBlocker component
- [ ] Crear páginas legales en ambos idiomas (Terms, Privacy)
- [x] Persistir preferencia de idioma en localStorage


## Actualizar Logo Landing Page
- [x] Copiar nuevo logo (logocop-02.png) al directorio público
- [x] Actualizar header de Landing para usar solo el icono (sin texto)
- [x] Actualizar footer de Landing para usar solo el icono (sin texto)
- [x] Verificar que el logo se vea correctamente
- [x] Guardar checkpoint


## Actualizar Sección Compliance
- [x] Rediseñar badges de compliance sin íconos circulares
- [x] Mostrar solo texto de badges (GDPR, ISO 27001, ISO 9001, SOC 2, HIPAA)
- [x] Mantener diseño minimalista y limpio
- [x] Verificar en ambos idiomas (ES/EN)
- [x] Guardar checkpoint


## Menú Hamburguesa Responsive
- [x] Implementar menú hamburguesa para móviles en Landing page
- [x] Ocultar navegación desktop en pantallas < 768px
- [x] Agregar animación smooth para apertura/cierre del menú
- [x] Verificar funcionamiento en móvil
- [x] Guardar checkpoint y hacer push


## Sistema de Autenticación Propio (Email/Contraseña)
- [x] Actualizar esquema de users para incluir email, password_hash, email_verified
- [x] Instalar dependencias: bcryptjs para hash de contraseñas
- [x] Crear endpoints de registro (signup) y login en routers.ts
- [x] Implementar generación y verificación de JWT tokens
- [x] Actualizar context.ts para usar JWT en lugar de Manus OAuth
- [x] Crear página de registro (/signup) con diseño minimalista
- [x] Crear página de login (/login) con diseño minimalista
- [x] Actualizar Landing para redirigir a /signup en lugar de Manus OAuth
- [x] Agregar rutas de signup y login a App.tsx
- [x] Agregar todas las funciones faltantes de db.ts (clients, invoices, transactions, savings goals)
- [x] Probar registro con validación de usuarios duplicados
- [ ] Actualizar DashboardLayout para usar autenticación propia
- [ ] Actualizar sistema de trial para inicializar en registro
- [ ] Probar flujo completo: registro → login → dashboard → trial
- [ ] Guardar checkpoint y hacer push


## Seguridad de Grado Militar
- [x] Instalar dependencias de seguridad (crypto para AES-256, express-rate-limit, helmet)
- [x] Implementar encriptación AES-256-GCM para datos sensibles en base de datos
- [x] Crear helpers de encriptación/desencriptación con rotación de claves
- [ ] Encriptar campos sensibles: email, nombre, datos financieros
- [x] Aumentar bcrypt salt rounds a 12 para mayor seguridad
- [ ] Implementar rate limiting en endpoints de autenticación (5 intentos/15min)
- [ ] Agregar helmet para headers de seguridad (HSTS, CSP, X-Frame-Options)
- [ ] Implementar validación estricta de inputs con zod
- [ ] Crear sistema de auditoría con logs de operaciones sensibles
- [ ] Agregar tabla de audit_logs en base de datos
- [ ] Implementar CORS restrictivo solo para dominios autorizados
- [ ] Agregar protección CSRF para formularios
- [ ] Configurar JWT con expiración corta (1 hora) y refresh tokens
- [ ] Implementar 2FA opcional con TOTP (Google Authenticator)
- [ ] Documentar medidas de seguridad implementadas
- [ ] Guardar checkpoint y hacer push


## Sección de Estándares de Seguridad en Landing
- [x] Crear nueva sección "Seguridad de Grado Militar" en Landing page
- [x] Agregar explicación detallada de medidas de seguridad implementadas
- [x] Incluir información sobre: AES-256-GCM, bcrypt 12 rounds, JWT tokens, rate limiting, HTTPS
- [x] Traducir contenido a español en LandingLanguageContext
- [x] Traducir contenido a inglés en LandingLanguageContext
- [x] Posicionar sección después de pricing y antes de badges de cumplimiento
- [x] Verificar diseño minimalista y legibilidad en ambos idiomas
- [x] Guardar checkpoint y hacer push

## Eliminar Sección de Compliance Badges
- [x] Eliminar sección "Cumplimiento y Seguridad" de Landing.tsx
- [x] Eliminar badges de GDPR, ISO 27001, ISO 9001, SOC 2, HIPAA
- [x] Actualizar navegación de #compliance a #security
- [x] Verificar que la landing page se vea correctamente sin la sección
- [x] Guardar checkpoint y hacer push

## Actualizar Precio a $199 USD
- [x] Cambiar precio en LandingLanguageContext.tsx (español e inglés)
- [x] Verificar que el precio se muestre correctamente en la landing page
- [x] Guardar checkpoint y hacer push

## Sistema Completo de Super Admin, Trial y Soporte

### Base de Datos
- [x] Agregar campos a tabla users: trial_ends_at, has_lifetime_access, role super_admin
- [x] Crear tabla support_tickets (id, user_id, subject, status, priority, created_at, updated_at)
- [x] Crear tabla support_messages (id, ticket_id, sender_id, message, is_admin_reply, created_at)
- [x] Ejecutar db:push para aplicar cambios

### Backend - Sistema de Roles y Trial
- [x] Crear middleware superAdminProcedure para proteger rutas de super admin
- [x] Crear procedimiento para verificar estado de trial del usuario (ya existía en access.ts)
- [x] Crear procedimientos CRUD para tickets de soporte
- [x] Crear procedimientos para mensajes de soporte
- [x] Crear procedimiento para listar todos los usuarios (solo admin)
- [x] Crear procedimiento para actualizar has_lifetime_access después de pago

### Dashboard de Super Admin
- [ ] Crear página /admin con protección de super admin
- [ ] Implementar tabla de usuarios con filtros (trial, expirado, lifetime)
- [ ] Mostrar estadísticas: total usuarios, con trial activo, con lifetime, tickets abiertos
- [ ] Crear sección de gestión de tickets de soporte
- [ ] Implementar vista de conversación de tickets con respuestas

### Sistema de Soporte para Usuarios
- [ ] Crear componente SupportButton flotante en dashboard
- [ ] Crear modal/página para crear nuevo ticket
- [ ] Crear página para ver historial de tickets del usuario
- [ ] Implementar vista de conversación individual de ticket
- [ ] Agregar notificaciones cuando admin responde

### Bloqueo Post-Trial
- [ ] Crear componente TrialExpiredOverlay
- [ ] Implementar lógica de verificación de trial en rutas protegidas
- [ ] Bloquear acceso a funcionalidades cuando trial expira
- [ ] Mostrar solo botón de "Actualizar a Lifetime" cuando está bloqueado
- [ ] Permitir acceso a soporte incluso con trial expirado

### Testing y Finalización
- [ ] Probar flujo completo de registro y trial
- [ ] Probar creación de tickets y respuestas
- [ ] Probar dashboard de super admin
- [ ] Verificar bloqueo post-trial
- [ ] Guardar checkpoint y hacer push

## Eliminar Dependencias de Manus OAuth
- [x] Modificar server/_core/env.ts para hacer variables de Manus opcionales
- [x] Actualizar server/_core/index.ts para eliminar inicialización de OAuth
- [x] Limpiar referencias a Manus en server/_core/sdk.ts
- [x] Verificar que el sistema JWT funcione sin variables de Manus
- [x] Probar localmente que el servidor arranque correctamente
- [ ] Hacer push a GitHub y verificar deployment en Railway

## Implementar Autenticación de Dos Factores (2FA) Opcional
### Base de Datos
- [ ] Agregar campos a tabla users: twofa_enabled (boolean), twofa_secret (string encrypted)
- [ ] Ejecutar db:push para aplicar cambios

### Backend
- [ ] Instalar dependencia: otplib para generar/verificar códigos TOTP
- [ ] Crear procedimientos tRPC para:
  - [ ] Generar secret y QR code para activar 2FA
  - [ ] Verificar código y activar 2FA
  - [ ] Desactivar 2FA
  - [ ] Verificar código 2FA durante login
- [ ] Modificar flujo de login para requerir 2FA si está activado

### Frontend
- [ ] Crear página/modal de configuración de 2FA en perfil
- [ ] Mostrar QR code para escanear con Google Authenticator/Authy
- [ ] Input para verificar código antes de activar
- [ ] Botón para desactivar 2FA (con confirmación)
- [ ] Pantalla de verificación 2FA durante login
- [ ] Mostrar estado de 2FA en perfil (activado/desactivado)

### Testing
- [ ] Probar activación de 2FA con Google Authenticator
- [ ] Probar login con 2FA activado
- [ ] Probar desactivación de 2FA
- [ ] Guardar checkpoint y hacer push
