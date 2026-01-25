# Sistema de Notificaciones Persistentes - Finwrk

**Versión:** 1.0  
**Fecha:** Enero 2026  
**Estado:** ✅ Producción

---

## 📋 Resumen Ejecutivo

Sistema de notificaciones persistentes construido desde cero para Finwrk. Diseñado para ser **limpio, confiable y predecible**, sin sorpresas ni elementos emergentes no solicitados.

### Principios Fundamentales

1. **SOLO notificaciones persistentes** - Panel lateral único
2. **NO auto-popups** - El usuario controla cuándo ver notificaciones
3. **NO toasts automáticos** - Solo para feedback de acciones del usuario
4. **NO IA (todavía)** - Sistema simple y estable primero
5. **Render seguro** - Validación estricta antes de mostrar

---

## 🏗️ Arquitectura

### Base de Datos

**Tabla:** `notifications`

```sql
CREATE TABLE notifications (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  type ENUM('info', 'success', 'warning', 'error') NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  source ENUM('invoice', 'savings', 'system') NOT NULL,
  source_id BIGINT UNSIGNED NULL,
  is_read INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_user_read (user_id, is_read),
  INDEX idx_user_created (user_id, created_at),
  INDEX idx_source (source, source_id)
);
```

**Campos obligatorios:**
- `title` - NO puede ser vacío
- `message` - NO puede ser vacío
- `source` - Origen de la notificación
- `type` - Tipo semántico

**Campos opcionales:**
- `source_id` - ID de la entidad relacionada (factura, meta, etc)

---

## 🔌 Backend (tRPC)

### Router: `trpc.notifications.*`

#### 1. `list` - Listar notificaciones

```typescript
input: {
  unreadOnly?: boolean,  // Default: false
  limit?: number,        // Default: 50
}

output: Notification[]
```

**Características:**
- Ordenadas por `created_at DESC`
- Filtro opcional por no leídas
- Límite configurable

#### 2. `unreadCount` - Contar no leídas

```typescript
input: void

output: { count: number }
```

**Uso:** Badge en el icono de campana

#### 3. `markAsRead` - Marcar como leída

```typescript
input: {
  id: number
}

output: { success: boolean }
```

**Validación:** Ownership (solo el dueño puede marcar)

#### 4. `markAllAsRead` - Marcar todas como leídas

```typescript
input: void

output: { success: boolean }
```

**Efecto:** Marca todas las notificaciones del usuario como leídas

#### 5. `create` - Crear notificación (interno)

```typescript
input: {
  type: "info" | "success" | "warning" | "error",
  title: string,
  message: string,
  source: "invoice" | "savings" | "system",
  source_id?: number,
}

output: {
  success: boolean,
  notificationId?: number,
  reason?: "duplicate"
}
```

**Validaciones:**
- ✅ `title.length > 0`
- ✅ `message.length > 0`
- ✅ Prevención de duplicados (source + source_id + type)

**Logging:**
- Notificación creada
- Notificación descartada
- Motivo del descarte

---

## 🎯 Eventos Generadores

### Facturas (Invoice)

#### 1. Factura marcada como pagada

**Trigger:** `routers_invoices.ts` - `updateStatus` (línea 285)

```typescript
notifyInvoicePaid(
  userId: number,
  invoiceId: number,
  invoiceNumber: string,
  amount: number,
  currency: string
)
```

**Ejemplo:**
```
Título: "Factura INV-001 pagada"
Mensaje: "La factura INV-001 ha sido marcada como pagada. Monto: 1500 USD."
Tipo: success
Source: invoice
Source ID: 123
```

#### 2. Factura vencida (pendiente)

**Estado:** No implementado (requiere cron job)

**Diseño futuro:**
```typescript
notifyInvoiceOverdue(
  userId: number,
  invoiceId: number,
  invoiceNumber: string,
  dueDate: Date
)
```

### Ahorros (Savings)

#### 3. Meta completada

**Trigger:** `routers_savings.ts` - `updateProgress` (línea 211)

```typescript
notifySavingsGoalCompleted(
  userId: number,
  goalId: number,
  goalName: string,
  targetAmount: number,
  currency: string
)
```

**Ejemplo:**
```
Título: "¡Meta de ahorro completada!"
Mensaje: "Felicidades, has completado tu meta 'Vacaciones' de 5000 EUR."
Tipo: success
Source: savings
Source ID: 456
```

#### 4. Meta sin movimiento (pendiente)

**Estado:** No implementado (trigger manual)

### Sistema (System)

#### 5. Moneda principal no configurada (pendiente)

**Estado:** No implementado (trigger en login)

**Diseño futuro:**
```typescript
notifyPrimaryCurrencyNotSet(userId: number)
```

---

## 🎨 Frontend (UI)

### Componente: `NotificationsPanel.tsx`

**Ubicación:** Header del dashboard (esquina superior derecha)

**Características:**

#### Icono de campana
- Badge con contador de no leídas
- Rojo con número (1-9) o "9+" si más de 9
- Hover effect

#### Panel lateral
- Ancho: 384px (sm:w-96)
- Altura: 100vh (full screen)
- Overlay semi-transparente
- Slide-in desde la derecha

#### Lista de notificaciones
- Scroll interno
- Ordenadas por fecha (desc)
- Formato de fecha relativo ("Hace 5m", "Hace 2h", "Hace 3d")

#### Tarjetas de notificación
- Fondo: `#222222` (no leídas), `#1a1a1a` (leídas)
- Bordes redondeados
- Icono semántico (info/success/warning/error)
- Título en negrita
- Mensaje en gris
- Fecha en gris claro
- Botón "marcar como leída" (solo si no leída)

#### Acciones
- Marcar como leída (individual)
- Marcar todas como leídas (botón en header)

---

## 🔒 Validaciones

### Backend

#### Creación de notificación

```typescript
// Validación de título
if (!title || title.trim().length === 0) {
  console.error(`[Notifications] DISCARDED: Empty title`);
  throw new Error("Title cannot be empty");
}

// Validación de mensaje
if (!message || message.trim().length === 0) {
  console.error(`[Notifications] DISCARDED: Empty message`);
  throw new Error("Message cannot be empty");
}

// Prevención de duplicados
if (source_id) {
  const existing = await db.select()
    .from(notifications)
    .where(
      user_id = userId AND
      source = source AND
      source_id = sourceId AND
      type = type
    )
    .limit(1);
    
  if (existing) {
    console.log(`[Notifications] DISCARDED: Duplicate`);
    return { success: false, reason: "duplicate" };
  }
}
```

### Frontend

#### Render seguro

```typescript
const safeNotifications = notifications.filter((n) => {
  if (!n.title || n.title.trim().length === 0) {
    console.error(`[NotificationsPanel] RENDER ERROR: Empty title for notification ${n.id}`);
    return false;
  }
  if (!n.message || n.message.trim().length === 0) {
    console.error(`[NotificationsPanel] RENDER ERROR: Empty message for notification ${n.id}`);
    return false;
  }
  return true;
});
```

**Resultado:** Solo se renderizan notificaciones válidas

---

## 📊 Logging

### Backend

#### Creación exitosa
```
[Notifications] Create attempt by user 123: { type: 'success', title: 'Factura pagada', source: 'invoice', source_id: 456 }
[Notifications] Created successfully: 789 - Factura pagada
```

#### Descarte por título vacío
```
[Notifications] Create attempt by user 123: { type: 'info', title: '', source: 'system' }
[NotificationHelper] DISCARDED: Empty title
```

#### Descarte por duplicado
```
[Notifications] Create attempt by user 123: { type: 'success', title: 'Meta completada', source: 'savings', source_id: 456 }
[NotificationHelper] DISCARDED: Duplicate notification for source savings id 456
```

### Frontend

#### Error de render
```
[NotificationsPanel] RENDER ERROR: Empty title for notification 123
[NotificationsPanel] RENDER ERROR: Empty message for notification 456
```

---

## 🎨 Diseño Visual

### Colores

**Fondo:**
- Panel: `#000000`
- Tarjetas no leídas: `#222222`
- Tarjetas leídas: `#1a1a1a`

**Bordes:**
- No leídas: `border-gray-700`
- Leídas: `border-gray-800`

**Texto:**
- Título: `text-white`
- Mensaje: `text-gray-400`
- Fecha: `text-gray-500`

**Iconos semánticos:**
- Info: `text-gray-400` (Info icon)
- Success: `text-green-500` (CheckCircle2 icon)
- Warning: `text-yellow-500` (AlertTriangle icon)
- Error: `text-red-500` (AlertCircle icon)

### Iconos (lucide-react)

- Bell - Icono principal
- Check - Marcar como leída
- CheckCheck - Marcar todas como leídas
- X - Cerrar panel
- Info - Tipo info
- CheckCircle2 - Tipo success
- AlertTriangle - Tipo warning
- AlertCircle - Tipo error

---

## 🚫 Prohibiciones Absolutas

1. ❌ **NO emergentes** - Sin popups automáticos
2. ❌ **NO auto-dismiss** - Las notificaciones no desaparecen solas
3. ❌ **NO IA** - Sin generación automática de notificaciones (por ahora)
4. ❌ **NO Redis** - Base de datos MySQL suficiente por ahora
5. ❌ **NO reglas complejas** - Sistema simple y predecible
6. ❌ **NO mensajes vacíos** - Validación estricta
7. ❌ **NO tarjetas deformes** - Render seguro
8. ❌ **NO glassmorphism** - Diseño limpio y sólido

---

## ✅ Validación Final

El sistema es correcto SOLO si:

1. ✅ No aparecen notificaciones viejas del sistema anterior
2. ✅ No hay tarjetas deformes o sin contenido
3. ✅ No hay tarjetas sin texto visible
4. ✅ El panel lateral es la única UI de notificaciones
5. ✅ El sistema es estable al recargar la página
6. ✅ El contador de no leídas es preciso
7. ✅ Las notificaciones se marcan como leídas correctamente
8. ✅ No hay notificaciones duplicadas

---

## 📁 Archivos Modificados/Creados

### Backend
1. `drizzle/schema.ts` - Tabla notifications actualizada
2. `drizzle/migrations/0011_update_notifications_persistent.sql` - Migración
3. `server/routers_notifications.ts` - Router tRPC (nuevo)
4. `server/routers.ts` - Registro del router
5. `server/helpers/notificationHelpers.ts` - Helpers de eventos (nuevo)
6. `server/routers_invoices.ts` - Evento de factura pagada
7. `server/routers_savings.ts` - Evento de meta completada

### Frontend
8. `client/src/components/NotificationsPanel.tsx` - Panel lateral (nuevo)
9. `client/src/components/DashboardLayout.tsx` - Integración del panel
10. `client/src/App.tsx` - Eliminación de providers antiguos

### Eliminados
11. `client/src/components/AlertAIAnalysis.tsx` - ❌
12. `client/src/components/AlertCenter.tsx` - ❌
13. `client/src/components/AlertToast.tsx` - ❌
14. `client/src/components/AlertsWidget.tsx` - ❌
15. `client/src/components/PaymentNotifications.tsx` - ❌
16. `client/src/components/PaymentReceivedNotification.tsx` - ❌
17. `client/src/components/ReminderAlert.tsx` - ❌
18. `client/src/components/ReminderNotificationProvider.tsx` - ❌
19. `client/src/hooks/useNotification.ts` - ❌
20. `client/src/hooks/useNotifications.ts` - ❌
21. `client/src/hooks/useUpcomingReminders.ts` - ❌
22. `client/src/pages/AlertTesting.tsx` - ❌

---

## 📈 Métricas de Implementación

- **Fases completadas:** 7/8
- **Commits:** 3 commits principales
- **Archivos creados:** 4 archivos
- **Archivos modificados:** 6 archivos
- **Archivos eliminados:** 12 archivos
- **Líneas agregadas:** ~800 líneas
- **Endpoints tRPC:** 5 endpoints
- **Eventos implementados:** 2 eventos (factura pagada, meta completada)
- **Eventos pendientes:** 3 eventos (factura vencida, meta inactiva, moneda no configurada)

---

## 🔮 Futuras Mejoras

### Corto plazo (1-2 semanas)
1. Implementar evento de factura vencida (cron job)
2. Agregar evento de moneda no configurada (en login)
3. Agregar filtros por tipo de notificación

### Mediano plazo (1-2 meses)
1. Implementar notificaciones push (PWA)
2. Agregar preferencias de notificaciones por usuario
3. Implementar notificaciones por email (opcional)

### Largo plazo (3-6 meses)
1. Agregar IA para notificaciones inteligentes
2. Implementar Redis para notificaciones en tiempo real
3. Agregar notificaciones de recordatorios automáticos
4. Implementar sistema de prioridades

---

## 🐛 Troubleshooting

### Problema: No aparecen notificaciones

**Causa:** Notificaciones con título o mensaje vacío

**Solución:**
1. Revisar logs del backend: `[Notifications] DISCARDED: Empty title`
2. Verificar que los helpers usen `trim()` antes de crear
3. Asegurar que los eventos pasen datos válidos

### Problema: Notificaciones duplicadas

**Causa:** Mismo source + source_id + type

**Solución:**
1. Revisar logs: `[Notifications] DISCARDED: Duplicate`
2. Verificar que el evento no se dispare múltiples veces
3. Considerar si el duplicado es intencional

### Problema: Contador de no leídas incorrecto

**Causa:** Cache del frontend no invalidado

**Solución:**
1. Verificar que las mutations invaliden el cache
2. Revisar `utils.notifications.unreadCount.invalidate()`
3. Considerar reducir el `refetchInterval`

### Problema: Tarjetas deformes

**Causa:** Notificación con título o mensaje vacío pasó las validaciones

**Solución:**
1. Revisar logs del frontend: `[NotificationsPanel] RENDER ERROR`
2. Verificar el filtro `safeNotifications`
3. Agregar validación adicional en el backend

---

## 📞 Soporte

Para cualquier pregunta o problema:
- **Documentación:** Este archivo (`SISTEMA_NOTIFICACIONES.md`)
- **Logs:** Railway logs para debugging
- **Repositorio:** `georgemontilva-crypto/WorkFlow`

---

## 🎯 Objetivo Final Alcanzado

Un sistema de notificaciones:

✅ **Limpio** - Sin elementos innecesarios  
✅ **Legible** - Texto claro y visible  
✅ **Persistente** - No desaparecen solas  
✅ **Confiable** - Validaciones estrictas  
✅ **Sin sorpresas** - Comportamiento predecible  

**Primero estabilidad. Luego inteligencia.**

---

**Fin del documento**
