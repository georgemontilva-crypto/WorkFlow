# HiWork Migration TODO

## Phase 1: Database Schema & tRPC Routers
- [x] Create database schema in drizzle/schema.ts (clients, invoices, transactions, savingsGoals)
- [x] Run pnpm db:push to create tables
- [x] Create database helper functions in server/db.ts
- [x] Create tRPC routers in server/routers.ts with CRUD operations

## Phase 2: Frontend Migration from Dexie to tRPC
- [x] Migrate Clients.tsx to use tRPC
- [ ] Migrate Invoices.tsx to use tRPC
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
