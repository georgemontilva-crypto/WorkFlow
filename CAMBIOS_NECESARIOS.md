# 🔧 Cambios Necesarios para Hacer el Sistema Robusto

## 🎯 Problema Principal

El frontend está usando **IndexedDB local (Dexie)** en lugar del backend MySQL. Esto significa:
- Los datos solo se guardan en el navegador
- No se sincronizan con el servidor
- Se pierden al limpiar el navegador
- No funcionan en Railway

## ✅ Solución Aplicada

### Backend (✅ COMPLETADO)

1. **db.ts** - Funciones corregidas:
   - `createSavingsGoal()` - Ahora retorna `{ id: number }`
   - `createInvoice()` - Ahora retorna `{ id: number }`

2. **routers.ts** - Endpoints corregidos:
   - `savingsGoals.create` - Usa `target_date` en lugar de `deadline`, no envía `created_at/updated_at`
   - `savingsGoals.update` - Usa `target_date` en lugar de `deadline`, no envía `updated_at`
   - `invoices.create` - Usa campos correctos (`subtotal`, `tax`, `total`, `items` como JSON string)

### Frontend (⚠️ PENDIENTE)

Archivos que necesitan ser reescritos para usar tRPC:

1. **Savings.tsx** - Actualmente usa Dexie
   - Cambiar `useLiveQuery` por `trpc.savingsGoals.list.useQuery()`
   - Cambiar `db.savingsGoals.add` por `createSavingsGoal.mutate()`
   - Cambiar `db.savingsGoals.update` por `updateSavingsGoal.mutate()`
   - Cambiar `db.savingsGoals.delete` por `deleteSavingsGoal.mutate()`
   - Cambiar `deadline` por `target_date`

2. **Invoices.tsx** - Actualmente usa Dexie
   - Cambiar `useLiveQuery` por `trpc.invoices.list.useQuery()`
   - Cambiar `db.invoices.add` por `createInvoice.mutate()`
   - Cambiar `db.invoices.update` por `updateInvoice.mutate()`
   - Cambiar `db.invoices.delete` por `deleteInvoice.mutate()`
   - Enviar `subtotal`, `tax`, `total` en lugar de `amount`, `paid_amount`

3. **Finances.tsx** - Si usa Dexie
   - Similar a los anteriores

## 📋 Checklist de Cambios

### Backend
- [x] Corregir `createSavingsGoal` para retornar ID
- [x] Corregir `createInvoice` para retornar ID
- [x] Corregir `savingsGoals.create` router (target_date, sin timestamps)
- [x] Corregir `savingsGoals.update` router (target_date, sin updated_at)
- [x] Corregir `invoices.create` router (campos correctos, items como JSON)

### Frontend
- [ ] Reescribir Savings.tsx para usar tRPC
- [ ] Reescribir Invoices.tsx para usar tRPC
- [ ] Verificar Finances.tsx
- [ ] Verificar otros componentes que usen Dexie

## 🔍 Campos Corregidos

### Savings Goals
| Antes (Dexie) | Después (MySQL) |
|---------------|-----------------|
| `deadline` | `target_date` |
| `created_at` (manual) | `created_at` (auto) |
| `updated_at` (manual) | `updated_at` (auto) |

### Invoices
| Antes (Dexie) | Después (MySQL) |
|---------------|-----------------|
| `amount` | `subtotal` |
| `paid_amount` | (no existe) |
| `items` (array) | `items` (JSON string) |
| `status: "pending"` | `status: "draft"` |
| `created_at` (manual) | `created_at` (auto) |
| `updated_at` (manual) | `updated_at` (auto) |

## 🚀 Próximos Pasos

1. Reescribir Savings.tsx (PRIORIDAD ALTA)
2. Reescribir Invoices.tsx (PRIORIDAD ALTA)
3. Probar creación de metas
4. Probar creación de facturas
5. Commit y push
6. Desplegar en Railway
7. Verificar en producción
