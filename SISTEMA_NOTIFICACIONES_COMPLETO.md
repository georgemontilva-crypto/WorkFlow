# Sistema Completo de Notificaciones

## Objetivo

Implementar notificaciones emergentes (toasts) y persistentes para TODAS las actividades financieras importantes, con priorización de notificaciones urgentes en el panel lateral.

## Tipos de Notificaciones

### 1. Notificaciones de Clientes

#### Acciones que generan notificación:
- ✅ **Cliente creado** (Toast + DB)
  - Tipo: `success`
  - Título: "Cliente creado"
  - Mensaje: "El cliente {nombre} ha sido agregado exitosamente"
  - Urgente: NO

- ✅ **Cliente actualizado** (Solo Toast)
  - Tipo: `info`
  - Título: "Cliente actualizado"
  - Mensaje: "Los datos de {nombre} han sido actualizados"
  - Urgente: NO

- ✅ **Cliente eliminado** (Solo Toast)
  - Tipo: `warning`
  - Título: "Cliente eliminado"
  - Mensaje: "El cliente {nombre} ha sido eliminado"
  - Urgente: NO

### 2. Notificaciones de Facturas

#### Acciones que generan notificación:
- ✅ **Factura creada** (Toast + DB)
  - Tipo: `success`
  - Título: "Factura creada"
  - Mensaje: "Factura {número} creada por {monto} {moneda}"
  - Urgente: NO

- ✅ **Factura enviada por email** (Toast + DB)
  - Tipo: `success`
  - Título: "Factura enviada"
  - Mensaje: "Factura {número} enviada a {cliente}"
  - Urgente: NO

- 🔥 **Comprobante de pago recibido** (Toast + DB)
  - Tipo: `warning`
  - Título: "Comprobante recibido para {número}"
  - Mensaje: "El cliente ha subido un comprobante de pago. Revisa y confirma el pago."
  - Urgente: **SÍ** (aparece en panel lateral)
  - Source: `invoice`

- ✅ **Factura marcada como pagada** (Toast + DB)
  - Tipo: `success`
  - Título: "Factura pagada"
  - Mensaje: "Factura {número} marcada como pagada. Monto: {monto} {moneda}"
  - Urgente: NO

- 🔥 **Factura próxima a vencer** (Toast + DB)
  - Tipo: `warning`
  - Título: "Factura por vencer"
  - Mensaje: "La factura {número} vence en {días} días"
  - Urgente: **SÍ** (aparece en panel lateral)
  - Source: `invoice`

- 🔥 **Factura vencida** (Toast + DB)
  - Tipo: `error`
  - Título: "Factura vencida"
  - Mensaje: "La factura {número} venció el {fecha}. Considera enviar un recordatorio."
  - Urgente: **SÍ** (aparece en panel lateral)
  - Source: `invoice`

- ✅ **Factura cancelada** (Toast + DB)
  - Tipo: `warning`
  - Título: "Factura cancelada"
  - Mensaje: "Factura {número} ha sido cancelada"
  - Urgente: NO

- ✅ **Factura eliminada** (Solo Toast)
  - Tipo: `warning`
  - Título: "Factura eliminada"
  - Mensaje: "Factura {número} ha sido eliminada"
  - Urgente: NO

### 3. Notificaciones de Ahorros

#### Acciones que generan notificación:
- ✅ **Meta de ahorro creada** (Toast + DB)
  - Tipo: `success`
  - Título: "Meta de ahorro creada"
  - Mensaje: "Meta '{nombre}' creada con objetivo de {monto} {moneda}"
  - Urgente: NO

- ✅ **Progreso actualizado** (Toast + DB)
  - Tipo: `info`
  - Título: "Progreso actualizado"
  - Mensaje: "Agregados {monto} {moneda} a '{nombre}'. Progreso: {porcentaje}%"
  - Urgente: NO

- 🎉 **Meta completada** (Toast + DB)
  - Tipo: `success`
  - Título: "¡Meta completada!"
  - Mensaje: "Felicidades, has completado tu meta '{nombre}' de {monto} {moneda}"
  - Urgente: NO
  - Source: `savings`

- ✅ **Meta eliminada** (Solo Toast)
  - Tipo: `warning`
  - Título: "Meta eliminada"
  - Mensaje: "La meta '{nombre}' ha sido eliminada"
  - Urgente: NO

### 4. Notificaciones de Balance/Finanzas

#### Acciones que generan notificación:
- 💰 **Balance actualizado** (Toast + DB)
  - Tipo: `success`
  - Título: "Balance actualizado"
  - Mensaje: "Se han cargado {monto} {moneda} a tu balance"
  - Urgente: NO

- 💰 **Pago registrado** (Toast + DB)
  - Tipo: `success`
  - Título: "Pago registrado"
  - Mensaje: "Pago de {monto} {moneda} registrado para factura {número}"
  - Urgente: NO

## Arquitectura de Implementación

### Backend (server/helpers/notificationHelpers.ts)

Agregar funciones para cada tipo de notificación:

```typescript
// CLIENTES
export async function notifyClientCreated(userId: number, clientName: string)
export async function notifyClientUpdated(userId: number, clientName: string) // Solo toast
export async function notifyClientDeleted(userId: number, clientName: string) // Solo toast

// FACTURAS
export async function notifyInvoiceCreated(userId: number, invoiceId: number, invoiceNumber: string, amount: number, currency: string)
export async function notifyInvoiceSent(userId: number, invoiceId: number, invoiceNumber: string, clientName: string)
export async function notifyPaymentProofUploaded(userId: number, invoiceId: number, invoiceNumber: string) // YA EXISTE
export async function notifyInvoicePaid(userId: number, invoiceId: number, invoiceNumber: string, amount: number, currency: string) // YA EXISTE
export async function notifyInvoiceDueSoon(userId: number, invoiceId: number, invoiceNumber: string, daysUntilDue: number)
export async function notifyInvoiceOverdue(userId: number, invoiceId: number, invoiceNumber: string, dueDate: Date) // YA EXISTE
export async function notifyInvoiceCancelled(userId: number, invoiceId: number, invoiceNumber: string)

// AHORROS
export async function notifySavingsGoalCreated(userId: number, goalId: number, goalName: string, targetAmount: number, currency: string)
export async function notifySavingsProgressUpdated(userId: number, goalId: number, goalName: string, amount: number, currency: string, percentage: number)
export async function notifySavingsGoalCompleted(userId: number, goalId: number, goalName: string, targetAmount: number, currency: string) // YA EXISTE

// BALANCE
export async function notifyBalanceUpdated(userId: number, amount: number, currency: string)
export async function notifyPaymentRegistered(userId: number, invoiceId: number, invoiceNumber: string, amount: number, currency: string, newStatus: "partial" | "paid") // YA EXISTE
```

### Frontend - Toasts Locales

Para acciones que NO necesitan persistencia en DB, usar toasts directamente en el frontend:

```typescript
// En Clients.tsx
const createMutation = trpc.clients.create.useMutation({
  onSuccess: (data) => {
    success(`Cliente ${data.client.name} creado exitosamente`);
  }
});

// En Invoices.tsx
const deleteMutation = trpc.invoices.delete.useMutation({
  onSuccess: () => {
    success('Factura eliminada exitosamente');
  }
});
```

### Sistema de Prioridad

Las notificaciones urgentes (marcadas con 🔥) deben:
1. Aparecer en el panel lateral de notificaciones
2. Tener un badge visual (ej: borde rojo, icono de alerta)
3. No desaparecer automáticamente hasta ser leídas

Implementación en schema:
```typescript
// drizzle/schema.ts
export const notifications = sqliteTable("notifications", {
  // ... campos existentes
  is_urgent: integer("is_urgent").default(0).notNull(), // NUEVO CAMPO
  priority: integer("priority").default(0).notNull(), // 0=normal, 1=alta, 2=crítica
});
```

## Implementación por Fases

### Fase 1: Clientes
- Agregar notificaciones en `routers_clients.ts` (solo las que van a DB)
- Agregar toasts locales en `Clients.tsx` para acciones simples

### Fase 2: Facturas
- Agregar notificaciones faltantes en `routers_invoices.ts`
- Agregar toasts locales en `Invoices.tsx`
- Implementar sistema de detección de facturas próximas a vencer (cron job)

### Fase 3: Ahorros
- Agregar notificaciones en `routers_savings.ts`
- Agregar toasts locales en `Savings.tsx`
- Implementar detección de metas completadas

### Fase 4: Sistema de Prioridad
- Agregar campo `is_urgent` a schema
- Actualizar NotificationsPanel para mostrar notificaciones urgentes primero
- Agregar badge visual para notificaciones urgentes

### Fase 5: Testing y Despliegue
- Probar cada tipo de notificación
- Verificar que toasts aparezcan correctamente
- Verificar que notificaciones urgentes se guarden en DB
- Verificar que panel lateral muestre notificaciones urgentes

## Resumen de Cambios

### Backend
- ✅ `server/helpers/notificationHelpers.ts` - Agregar 15+ funciones nuevas
- ✅ `server/routers_clients.ts` - Agregar notificaciones
- ✅ `server/routers_invoices.ts` - Agregar notificaciones faltantes
- ✅ `server/routers_savings.ts` - Agregar notificaciones
- ✅ `drizzle/schema.ts` - Agregar campo `is_urgent`
- ✅ `server/cron/invoice-reminders.ts` - Crear cron job para facturas próximas a vencer

### Frontend
- ✅ `client/src/pages/Clients.tsx` - Agregar toasts locales
- ✅ `client/src/pages/Invoices.tsx` - Agregar toasts locales
- ✅ `client/src/pages/Savings.tsx` - Agregar toasts locales
- ✅ `client/src/components/NotificationsPanel.tsx` - Agregar priorización de urgentes

## Prioridad de Implementación

1. **Alta prioridad** (notificaciones urgentes):
   - Comprobante de pago recibido ✅ (ya existe)
   - Factura próxima a vencer
   - Factura vencida ✅ (ya existe)

2. **Media prioridad** (notificaciones importantes):
   - Factura creada
   - Factura enviada
   - Factura pagada
   - Meta de ahorro completada

3. **Baja prioridad** (toasts locales):
   - Cliente creado/actualizado/eliminado
   - Factura cancelada/eliminada
   - Meta de ahorro creada/actualizada/eliminada
