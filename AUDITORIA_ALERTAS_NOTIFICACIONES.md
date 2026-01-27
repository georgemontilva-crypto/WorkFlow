# Auditoría del Sistema de Alertas y Notificaciones

## 📋 Estado Actual del Sistema

### **1. Sistema de Alertas Emergentes (Toasts)**

**Ubicación**: `client/src/contexts/ToastContext.tsx`

**Funcionalidad**:
- ✅ Contexto global con hook `useToast()`
- ✅ 4 variantes: success, error, warning, info
- ✅ Desaparece automáticamente
- ✅ No se almacena en base de datos
- ✅ Posición fija: bottom-right

**Métodos disponibles**:
```typescript
toast.success(description, title?)
toast.error(description, title?)
toast.warning(description, title?)
toast.info(description, title?)
```

---

### **2. Sistema de Notificaciones Persistentes**

**Ubicación**: 
- Router: `server/routers_notifications.ts`
- Helpers: `server/helpers/notificationHelpers.ts`
- Hook: `client/src/hooks/useRealtimeNotifications.ts`

**Funcionalidad**:
- ✅ Se almacenan en base de datos
- ✅ Aparecen en panel lateral
- ✅ Polling cada 5 segundos
- ✅ Validación de title y message
- ✅ Prevención de duplicados
- ✅ Logging completo

**Esquema**:
```typescript
{
  id: number
  user_id: number
  type: "info" | "success" | "warning" | "error"
  title: string (required)
  message: string (required)
  source: "invoice" | "savings" | "system"
  source_id?: number
  is_read: 0 | 1
  created_at: timestamp
}
```

---

## 🔍 Hallazgos de la Auditoría

### **✅ Lo que está funcionando bien**

1. **Separación clara de responsabilidades**
   - Toasts para feedback inmediato
   - Notificaciones persistentes para eventos importantes

2. **Validaciones robustas**
   - Title y message obligatorios
   - Prevención de duplicados
   - Logging detallado

3. **Helpers específicos**
   - `notifyInvoiceOverdue()`
   - `notifyInvoicePaid()`
   - `notifyPaymentRegistered()`
   - `notifyPaymentProofUploaded()`
   - `notifySavingsGoalCompleted()`

4. **Polling funcional**
   - Refetch cada 5 segundos
   - Muestra toast cuando hay nueva notificación

---

### **❌ Problemas Identificados**

#### **1. Falta de sincronización entre toasts y notificaciones**

**Problema**: Cuando se crea una notificación persistente, no siempre se muestra un toast inmediato.

**Impacto**: El usuario no recibe feedback instantáneo de eventos importantes.

**Solución**: Crear un helper unificado que:
- Muestre toast inmediatamente
- Cree notificación persistente si es relevante

---

#### **2. Procesos sin alertas ni notificaciones**

**Procesos a auditar**:
- ✅ Crear cliente
- ✅ Crear factura
- ✅ Enviar factura
- ✅ Registrar pago
- ⚠️ Factura vencida (solo notificación, sin toast inmediato)
- ✅ Completar meta de ahorro
- ⚠️ Error crítico del sistema

**Hallazgo**: Algunos procesos solo crean notificaciones persistentes pero no muestran toast inmediato.

---

#### **3. useRealtimeNotifications muestra toast de notificaciones viejas**

**Problema**: El hook muestra un toast cuando detecta una nueva notificación, pero esto ocurre con 5 segundos de delay (polling).

**Impacto**: El feedback no es inmediato.

**Solución**: 
- Mostrar toast INMEDIATAMENTE cuando se crea la notificación
- El polling solo debe actualizar el contador y el panel lateral

---

#### **4. No hay logging de toasts**

**Problema**: No hay logs cuando se dispara un toast.

**Impacto**: Difícil depurar por qué algunas alertas no aparecen.

**Solución**: Agregar console.log en ToastContext.

---

## 🎯 Plan de Corrección

### **Fase 1: Helper Unificado**

Crear `notificationService.ts` que:
1. Muestre toast inmediatamente
2. Cree notificación persistente si corresponde
3. Loggee ambas acciones

```typescript
interface NotifyOptions {
  type: "info" | "success" | "warning" | "error"
  title: string
  message: string
  persistent?: boolean // Si debe guardarse en DB
  source?: "invoice" | "savings" | "system"
  source_id?: number
}

async function notify(userId: number, options: NotifyOptions) {
  // 1. Mostrar toast inmediatamente (client-side)
  // 2. Si persistent=true, crear notificación en DB
  // 3. Loggear ambas acciones
}
```

---

### **Fase 2: Auditar Procesos Críticos**

Verificar que TODOS estos procesos disparen alertas:

**Clientes**:
- ✅ Crear cliente → toast success
- ✅ Editar cliente → toast success
- ✅ Archivar cliente → toast info

**Facturas**:
- ✅ Crear factura → toast success
- ✅ Enviar factura → toast success + notificación persistente
- ✅ Factura vencida → toast warning + notificación persistente
- ✅ Marcar como pagada → toast success + notificación persistente

**Pagos**:
- ✅ Registrar pago → toast success + notificación persistente
- ✅ Comprobante subido → toast info + notificación persistente

**Ahorros**:
- ✅ Crear meta → toast success
- ✅ Completar meta → toast success + notificación persistente

**Sistema**:
- ⚠️ Error crítico → toast error + notificación persistente

---

### **Fase 3: Logging Completo**

Agregar logs en:
- ToastContext (cuando se dispara un toast)
- notificationHelpers (cuando se crea notificación)
- Procesos críticos (antes y después de disparar alerta)

---

### **Fase 4: Eliminar Delay de Polling**

Modificar `useRealtimeNotifications` para:
- NO mostrar toast de notificaciones nuevas (eso ya se hizo en el momento)
- Solo actualizar contador y panel lateral

---

## 📊 Resumen de Acciones

| Acción | Prioridad | Estado |
|--------|-----------|--------|
| Crear helper unificado | Alta | Pendiente |
| Auditar procesos críticos | Alta | Pendiente |
| Agregar logging completo | Media | Pendiente |
| Eliminar delay de polling | Media | Pendiente |
| Validar en producción | Alta | Pendiente |

---

## 🎯 Criterios de Éxito

El sistema es correcto SOLO si:

1. ✅ Las alertas emergentes aparecen SIEMPRE que corresponde
2. ✅ Las notificaciones importantes quedan guardadas en el panel lateral
3. ✅ No hay alertas perdidas
4. ✅ No hay notificaciones vacías o duplicadas
5. ✅ El usuario siente feedback inmediato y confianza
6. ✅ Los logs permiten depurar cualquier problema

---

**Fecha**: 26 de enero de 2026
**Estado**: Auditoría completada, correcciones pendientes
