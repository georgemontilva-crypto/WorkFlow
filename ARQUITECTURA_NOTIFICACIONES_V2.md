# 🔔 ARQUITECTURA DEL NUEVO SISTEMA DE NOTIFICACIONES

## 📋 ESTADO ACTUAL

### ✅ Ya existe en la base de datos:
```sql
CREATE TABLE alerts (
  id SERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL,
  type ENUM('info', 'warning', 'critical'),
  event VARCHAR(100),
  message TEXT,
  persistent INT DEFAULT 1,
  shown_as_toast INT DEFAULT 0,
  is_read INT DEFAULT 0,
  action_url VARCHAR(255),
  action_text VARCHAR(50),
  required_plan ENUM('free', 'pro', 'business'),
  related_id BIGINT,
  related_type VARCHAR(50),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

**Problema:** El modelo actual no sigue los principios especificados.

---

## 🎯 NUEVO MODELO (SIMPLIFICADO)

### **Tabla: `notifications`**

```sql
CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL,
  
  -- Campos obligatorios
  type ENUM('info', 'success', 'warning', 'error') NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  priority ENUM('low', 'normal', 'high') NOT NULL DEFAULT 'normal',
  
  -- Estado
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  
  -- Metadata
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  INDEX idx_user_read (user_id, is_read),
  INDEX idx_user_created (user_id, created_at DESC)
);
```

**Cambios vs tabla actual:**
- ✅ Renombrar `alerts` → `notifications`
- ✅ Tipo: `info | success | warning | error` (en lugar de `info | warning | critical`)
- ✅ Agregar `title` (obligatorio)
- ✅ Renombrar `message` → `message` (mantener)
- ✅ Agregar `priority` (`low | normal | high`)
- ✅ Simplificar `is_read` (boolean en lugar de int)
- ❌ Eliminar campos innecesarios:
  - `event` (redundante con `type`)
  - `persistent` (todas son persistentes)
  - `shown_as_toast` (se maneja en Redis)
  - `action_url`, `action_text` (no se usan)
  - `required_plan` (no se usa)
  - `related_id`, `related_type` (no se usan)
  - `updated_at` (no se necesita)

---

## 🔄 ARQUITECTURA DEL SISTEMA

### **1. Flujo de Creación**

```
Evento del sistema
    ↓
Validar datos (title, message)
    ↓
Verificar en Redis:
  - Duplicado reciente?
  - Cooldown activo?
    ↓
Si pasa validación:
  - Guardar en DB (persistente)
  - Encolar en Redis (temporal)
    ↓
Si no pasa:
  - Descartar y loggear
```

### **2. Redis: Estructura de Datos**

```typescript
// Cola de notificaciones pendientes por usuario
notifications:queue:{user_id} → List<NotificationData>

// Control de duplicados (TTL: 5 minutos)
notifications:dedup:{user_id}:{hash} → "1"

// Cooldowns por tipo de evento (TTL: variable)
notifications:cooldown:{user_id}:{event_type} → "1"

// Rate limiting (TTL: 1 minuto)
notifications:ratelimit:{user_id} → counter
```

### **3. Separación de Responsabilidades**

| Componente | Fuente | Propósito | Duración |
|------------|--------|-----------|----------|
| **Toasts** | Redis | Notificaciones emergentes | Temporal (se eliminan al mostrarse) |
| **Panel** | Database | Historial persistente | Permanente |

---

## 🛠️ IMPLEMENTACIÓN

### **Backend**

```typescript
// server/services/notifications.ts

interface CreateNotificationInput {
  user_id: number;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  priority?: 'low' | 'normal' | 'high';
  event_type?: string; // Para cooldowns
}

async function createNotification(input: CreateNotificationInput) {
  // 1. Validar datos obligatorios
  if (!input.title || !input.message) {
    console.error('[Notifications] Missing title or message');
    return null;
  }
  
  // 2. Verificar duplicados en Redis
  const hash = createHash(input);
  const isDuplicate = await redis.exists(`notifications:dedup:${input.user_id}:${hash}`);
  if (isDuplicate) {
    console.log('[Notifications] Duplicate notification discarded');
    return null;
  }
  
  // 3. Verificar cooldown
  if (input.event_type) {
    const cooldownActive = await redis.exists(`notifications:cooldown:${input.user_id}:${input.event_type}`);
    if (cooldownActive) {
      console.log('[Notifications] Cooldown active, notification discarded');
      return null;
    }
  }
  
  // 4. Verificar rate limit (máx 10 notificaciones por minuto)
  const count = await redis.incr(`notifications:ratelimit:${input.user_id}`);
  if (count === 1) {
    await redis.expire(`notifications:ratelimit:${input.user_id}`, 60);
  }
  if (count > 10) {
    console.warn('[Notifications] Rate limit exceeded');
    return null;
  }
  
  // 5. Guardar en base de datos (persistente)
  const notification = await db.insert(notifications).values({
    user_id: input.user_id,
    type: input.type,
    title: input.title,
    message: input.message,
    priority: input.priority || 'normal',
  }).returning();
  
  // 6. Encolar en Redis (temporal)
  await redis.rpush(
    `notifications:queue:${input.user_id}`,
    JSON.stringify(notification)
  );
  
  // 7. Establecer controles
  await redis.setex(`notifications:dedup:${input.user_id}:${hash}`, 300, '1'); // 5 min
  if (input.event_type) {
    await redis.setex(`notifications:cooldown:${input.user_id}:${input.event_type}`, getCooldownTTL(input.event_type), '1');
  }
  
  console.log('[Notifications] Created:', notification.id);
  return notification;
}
```

### **Frontend**

```typescript
// client/src/hooks/useNotifications.ts

export function useNotifications() {
  const { data: user } = useUser();
  
  // Obtener toasts desde Redis (vía tRPC)
  const { data: pendingToasts } = trpc.notifications.getPending.useQuery(
    undefined,
    {
      enabled: !!user,
      refetchInterval: 5000, // Cada 5 segundos
    }
  );
  
  // Obtener historial desde DB
  const { data: history } = trpc.notifications.getHistory.useQuery(
    { limit: 50 },
    { enabled: !!user }
  );
  
  // Marcar como leída
  const markAsRead = trpc.notifications.markAsRead.useMutation();
  
  // Mostrar toast
  useEffect(() => {
    if (pendingToasts && pendingToasts.length > 0) {
      pendingToasts.forEach((notif) => {
        toast[notif.type](notif.title, {
          description: notif.message,
          duration: 5000,
        });
      });
      
      // Eliminar de Redis después de mostrar
      trpc.notifications.clearPending.mutate();
    }
  }, [pendingToasts]);
  
  return {
    history,
    unreadCount: history?.filter(n => !n.is_read).length || 0,
    markAsRead,
  };
}
```

---

## 🎨 ESTILO VISUAL

```typescript
// Paleta de colores
const colors = {
  background: '#000000',
  card: '#222222',
  accent: '#EBFF57',
  text: '#FFFFFF',
  textMuted: '#999999',
};

// Componente de Toast
<Toast className="bg-[#222222] border-none rounded-lg">
  <ToastTitle className="text-white">{title}</ToastTitle>
  <ToastDescription className="text-[#999999]">{message}</ToastDescription>
</Toast>

// Panel lateral
<div className="bg-[#222222] rounded-lg p-4">
  <div className="flex items-center justify-between mb-4">
    <h3 className="text-white font-semibold">Notificaciones</h3>
    <Badge className="bg-[#EBFF57] text-black">{unreadCount}</Badge>
  </div>
  {/* Lista de notificaciones */}
</div>
```

---

## 📊 EVENTOS QUE GENERAN NOTIFICACIONES

| Evento | Tipo | Cooldown | Prioridad |
|--------|------|----------|-----------|
| Factura creada | success | 1 min | normal |
| Factura enviada | success | 1 min | normal |
| Pago recibido | success | 5 min | high |
| Factura vencida | warning | 1 día | high |
| Cliente creado | info | 1 min | low |
| Error al enviar email | error | 5 min | high |

---

## 🚀 PLAN DE IMPLEMENTACIÓN

### **Fase 1: Base de Datos**
1. Crear tabla `notifications`
2. Migrar datos de `alerts` (si es necesario)
3. Eliminar tabla `alerts`

### **Fase 2: Backend**
1. Crear servicio `notifications.ts`
2. Implementar funciones de creación con Redis
3. Crear endpoints tRPC

### **Fase 3: Frontend**
1. Hook `useNotifications`
2. Componente de toasts
3. Panel lateral de historial

### **Fase 4: Integración**
1. Agregar notificaciones en eventos clave
2. Probar flujo completo
3. Ajustar cooldowns y rate limits

---

## ✅ PRINCIPIOS CUMPLIDOS

- ✅ Código nuevo (no reutilizado)
- ✅ Separación clara: toasts (Redis) vs historial (DB)
- ✅ Control de duplicados y cooldowns
- ✅ Validación estricta (title y message obligatorios)
- ✅ Logging completo
- ✅ Estilo visual consistente
- ✅ Mobile first
- ✅ Escalable con Redis

---

**Sistema limpio, controlado y predecible.** 🎯
