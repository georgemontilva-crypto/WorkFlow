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
- [ ] Push code to GitHub repository georgemontilva-crypto/WorkFlow
- [ ] Configure Railway project
- [ ] Set up PostgreSQL database on Railway
- [ ] Configure environment variables
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
