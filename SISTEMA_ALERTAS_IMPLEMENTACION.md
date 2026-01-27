# Sistema de Alertas y Notificaciones en Tiempo Real

## 🎯 Objetivo

Implementar un sistema robusto y confiable de alertas y notificaciones usando Redis Pub/Sub y SSE (Server-Sent Events) para feedback instantáneo al usuario.

---

## 📋 Arquitectura Implementada

### **1. Notificaciones Persistentes (Base de Datos)**

**Flujo**:
```
Evento importante (ej: factura pagada)
    ↓
Helper crea notificación en DB
    ↓
Publica evento en Redis
    ↓
Cliente recibe vía SSE
    ↓
Muestra toast inmediatamente
    ↓
Actualiza panel de notificaciones
```

**Componentes**:
- `server/helpers/notificationHelpers.ts` - Helpers para crear notificaciones
- `server/services/notificationsRealtimeService.ts` - Servicio Redis Pub/Sub
- `server/_core/index.ts` - Endpoint SSE `/api/notifications/stream`
- `client/src/hooks/useRealtimeNotifications.ts` - Hook SSE del cliente

---

### **2. Alertas Emergentes (Toasts)**

**Flujo**:
```
Acción del usuario (ej: crear cliente)
    ↓
Mutación tRPC exitosa
    ↓
toast.success() inmediato
    ↓
Usuario ve feedback instantáneo
```

**Componentes**:
- `client/src/contexts/ToastContext.tsx` - Contexto global de toasts
- `client/src/components/ui/toast.tsx` - Componente Toast
- Logging agregado para depuración

---

## ✅ Cambios Implementados

### **Backend**

1. **Endpoint SSE** (`server/_core/index.ts`)
   - Ruta: `GET /api/notifications/stream?token=<jwt>`
   - Autenticación vía query parameter (EventSource no soporta headers)
   - Heartbeat cada 30 segundos
   - Suscripción a Redis Pub/Sub por usuario

2. **Servicio Redis** (ya existía)
   - `notificationsRealtimeService.ts`
   - Pub/Sub para eventos en tiempo real
   - Canales por usuario: `notifications:user:{userId}`

3. **Helpers de Notificaciones** (ya existían)
   - `notifyInvoicePaid()`
   - `notifyPaymentRegistered()`
   - `notifyPaymentProofUploaded()`
   - `notifySavingsGoalCompleted()`
   - Validación de title y message
   - Prevención de duplicados

---

### **Frontend**

1. **Hook SSE** (`useRealtimeNotifications.ts`)
   - Reemplaza polling por SSE
   - Conexión persistente al servidor
   - Reconexión automática en caso de error
   - Muestra toast cuando llega notificación nueva
   - Invalida queries de tRPC para actualizar UI

2. **ToastContext con Logging**
   - Log en consola cada vez que se muestra un toast
   - Formato: `[Toast] Showing {variant} toast: {title/description}`

3. **Toasts en Clientes**
   - ✅ Crear cliente → toast success
   - ✅ Editar cliente → toast success
   - ✅ Archivar cliente → toast success
   - ✅ Eliminar cliente → toast success
   - ✅ Errores → toast error

4. **Toasts en Facturas** (ya existían)
   - ✅ Crear factura → toast success
   - ✅ Enviar factura → toast success
   - ✅ Marcar como pagada → toast success
   - ✅ Descargar PDF → toast success
   - ✅ Errores → toast error

---

## 🔄 Comparación: Antes vs Ahora

| Aspecto | Antes (Polling) | Ahora (SSE + Redis) |
|---------|-----------------|---------------------|
| **Latencia** | 5 segundos (polling) | < 100ms (tiempo real) |
| **Carga del servidor** | Query cada 5s por usuario | Solo cuando hay eventos |
| **Escalabilidad** | Baja (muchas queries) | Alta (Redis Pub/Sub) |
| **Feedback** | Delayed | Instantáneo |
| **Conexión** | HTTP requests repetidos | 1 conexión SSE persistente |
| **Logging** | Parcial | Completo |

---

## 🎯 Procesos con Alertas

### **Clientes**
- ✅ Crear → toast success
- ✅ Editar → toast success
- ✅ Archivar → toast success
- ✅ Eliminar → toast success

### **Facturas**
- ✅ Crear → toast success
- ✅ Enviar → toast success + notificación persistente
- ✅ Marcar como pagada → toast success + notificación persistente
- ✅ Descargar PDF → toast success

### **Pagos**
- ✅ Registrar pago → notificación persistente + toast en tiempo real
- ✅ Comprobante subido → notificación persistente + toast en tiempo real

### **Ahorros**
- ✅ Completar meta → notificación persistente + toast en tiempo real

---

## 📊 Logging Implementado

### **Backend**
- `[SSE] Client connected: user {userId}`
- `[SSE] Sending event to user {userId}: {type}`
- `[SSE] Client disconnected: user {userId}`
- `[NotificationHelper] Create attempt: {details}`
- `[NotificationHelper] Created successfully: {title}`
- `[NotificationHelper] DISCARDED: {reason}`
- `[Notifications Realtime] Published to {channel}: {type}`

### **Frontend**
- `[Realtime Notifications] Connecting to SSE...`
- `[Realtime Notifications] ✅ SSE connection established`
- `[Realtime Notifications] Event received: {type}`
- `[Realtime Notifications] New notification: {title}`
- `[Toast] Showing {variant} toast: {title/description}`

---

## 🚀 Despliegue

### **Variables de Entorno Requeridas**

Railway debe tener configurado:
```
REDIS_URL=redis://default:password@host:port
```

### **Verificación**

1. **Logs del servidor**:
   - Buscar `[Redis] ✅ Connected successfully`
   - Buscar `[SSE] Client connected`

2. **Logs del cliente**:
   - Abrir DevTools → Console
   - Buscar `[Realtime Notifications] ✅ SSE connection established`
   - Crear un cliente y verificar `[Toast] Showing success toast`

3. **Prueba end-to-end**:
   - Usuario A crea factura
   - Usuario A marca factura como pagada
   - Debe ver toast inmediatamente
   - Notificación debe aparecer en panel lateral
   - Log debe mostrar ambos eventos

---

## ✅ Criterios de Éxito

El sistema es correcto SOLO si:

1. ✅ **Toasts aparecen SIEMPRE** que corresponde
2. ✅ **Notificaciones importantes** quedan guardadas en DB
3. ✅ **Feedback instantáneo** (< 100ms)
4. ✅ **No hay alertas perdidas**
5. ✅ **Logs completos** para depuración
6. ✅ **Reconexión automática** si se cae SSE
7. ✅ **Sin polling** (eliminado completamente)

---

## 🐛 Debugging

### **Si no aparecen toasts**:
1. Verificar console: `[Toast] Showing...`
2. Verificar que `useToast()` está importado
3. Verificar que `success()` o `error()` se llama después de mutación exitosa

### **Si no llegan notificaciones en tiempo real**:
1. Verificar console: `[Realtime Notifications] ✅ SSE connection established`
2. Verificar que Redis está conectado: `[Redis] ✅ Connected successfully`
3. Verificar que el helper crea notificación: `[NotificationHelper] Created successfully`
4. Verificar que Redis publica: `[Notifications Realtime] Published to...`

### **Si SSE se desconecta**:
- El hook intenta reconectar automáticamente después de 5 segundos
- Verificar logs: `[Realtime Notifications] Reconnecting in 5 seconds...`

---

**Fecha**: 26 de enero de 2026
**Estado**: Implementación completa, listo para desplegar
