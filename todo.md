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
