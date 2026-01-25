# Auditoría de Limpieza - Finwrk
## Simplificación Radical del Sistema

**Fecha:** 24 de enero de 2026  
**Objetivo:** Eliminar toda lógica no esencial y dejar SOLO el módulo de CLIENTES funcionando

---

## 📋 ESTADO ACTUAL DEL PROYECTO

### Módulos Activos Identificados

#### ❌ PARA ELIMINAR/DESHABILITAR

**1. Sistema de Notificaciones**
- `./server/_core/notification.ts`
- `./server/services/notifications.ts`
- `./migrations/create_notifications_table.sql`
- `./client/public/notification.mp3`
- Tabla: `notifications` (si existe)

**2. Jobs Automáticos**
- `./server/_core/overdue-invoices-job.ts` - Monitoreo de facturas vencidas
- `./server/_core/proactive-ai-job.ts` - IA proactiva
- `./server/_core/recurring-invoices-job.ts` - Facturas recurrentes
- `./server/workers/reminder-worker.ts` - Worker de recordatorios

**3. Sistema de IA**
- `./server/ai_service.ts` - Servicio de IA

**4. Monitoreo de Precios y Mercados**
- `./server/services/priceMonitor.ts` - Monitoreo de precios
- `./server/queues/price-alerts-queue.ts` - Cola de alertas de precios
- `./server/workers/priceAlertsWorker.ts` - Worker de alertas
- Tabla: `price_alerts`
- Tabla: `market_favorites`

**5. Conversión de Divisas**
- `./client/src/lib/currency.ts` - Utilidades de divisas
- Lógica de conversión en el backend

**6. Metas de Ahorro**
- Tabla: `savings_goals`
- Endpoints relacionados en routers

**7. Sistema de Soporte**
- Tabla: `support_tickets`
- Tabla: `support_messages`

**8. Transacciones**
- Tabla: `transactions`
- Endpoints relacionados

**9. Facturas (TEMPORALMENTE)**
- Tabla: `invoices` - mantener estructura pero deshabilitar endpoints
- Endpoints de creación/edición de facturas

---

#### ✅ MANTENER (CORE MÍNIMO)

**1. Autenticación**
- Sistema de login/signup
- Verificación de email
- Recuperación de contraseña
- 2FA
- Tabla: `users`
- Tabla: `password_reset_tokens`

**2. Módulo de CLIENTES (ÚNICO MÓDULO ACTIVO)**
- Tabla: `clients`
- Endpoints de clientes
- UI de clientes

**3. Infraestructura Base**
- tRPC setup
- Database connection
- Email service (solo para auth)
- Redis (solo para auth/password reset)

---

## 🎯 MODELO DE CLIENTE ACTUAL vs REQUERIDO

### Estado Actual (schema.ts líneas 57-69)
```typescript
export const clients = mysqlTable("clients", {
  id: serial("id").primaryKey(),
  user_id: int("user_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  company: varchar("company", { length: 255 }),
  status: mysqlEnum("status", ["active", "inactive"]).notNull().default("active"),
  archived: boolean("archived").notNull().default(false),
  notes: text("notes"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});
```

### Análisis
✅ **CORRECTO** - El modelo actual ya cumple con los requisitos:
- ✅ Campos obligatorios: id, user_id, name, email, status, created_at, updated_at
- ✅ Campos opcionales: phone, company, notes
- ✅ NO tiene montos ni balances
- ✅ NO tiene lógica financiera directa
- ✅ Campo `archived` adicional (útil para soft delete)

**Acción:** Mantener el modelo actual, solo agregar validaciones

---

## 🔧 VALIDACIONES REQUERIDAS

### Validaciones Actuales a Verificar
1. ❓ name obligatorio
2. ❓ email obligatorio y válido
3. ❓ email único por usuario
4. ❓ normalización de email (lowercase, trim)

### Validaciones a Implementar
```typescript
// Validación con Zod
const createClientSchema = z.object({
  name: z.string().min(1, "Name is required").trim(),
  email: z.string().email("Invalid email").toLowerCase().trim(),
  phone: z.string().optional(),
  company: z.string().optional(),
  notes: z.string().optional(),
});

// Validación de email único por usuario
// Antes de crear: verificar que no exista otro cliente con el mismo email para ese user_id
```

---

## 📝 PLAN DE ACCIÓN DETALLADO

### FASE 1: Deshabilitar Jobs y Workers
```bash
# Renombrar archivos para deshabilitarlos (no ejecutar, solo documentar)
mv server/_core/overdue-invoices-job.ts server/_core/overdue-invoices-job.ts.disabled
mv server/_core/proactive-ai-job.ts server/_core/proactive-ai-job.ts.disabled
mv server/_core/recurring-invoices-job.ts server/_core/recurring-invoices-job.ts.disabled
mv server/workers/reminder-worker.ts server/workers/reminder-worker.ts.disabled
mv server/workers/priceAlertsWorker.ts server/workers/priceAlertsWorker.ts.disabled
```

### FASE 2: Deshabilitar Servicios
```bash
mv server/ai_service.ts server/ai_service.ts.disabled
mv server/services/priceMonitor.ts server/services/priceMonitor.ts.disabled
mv server/services/notifications.ts server/services/notifications.ts.disabled
mv server/queues/price-alerts-queue.ts server/queues/price-alerts-queue.ts.disabled
```

### FASE 3: Comentar Endpoints No Esenciales en routers.ts
- Comentar todos los endpoints de:
  - Invoices (crear, editar, eliminar)
  - Transactions
  - Savings Goals
  - Price Alerts
  - Market Favorites
  - Support Tickets
  - Notifications

- Mantener solo:
  - Auth endpoints
  - Clients endpoints

### FASE 4: Limpiar Imports en routers.ts
- Eliminar imports de servicios deshabilitados
- Eliminar imports de jobs deshabilitados

### FASE 5: Refactorizar Endpoints de Clientes
- Implementar validaciones estrictas
- Agregar logging obligatorio
- Verificar email único por usuario
- Normalizar email (lowercase, trim)

### FASE 6: Simplificar UI
- Mantener solo la página de Clientes
- Eliminar/ocultar navegación a otras páginas
- Formulario simple sin animaciones
- Errores inline

### FASE 7: Testing
- Probar creación de cliente
- Probar validación de email único
- Probar normalización de email
- Verificar logging

---

## 🚨 RIESGOS IDENTIFICADOS

1. **Redis Listeners**: Verificar si hay listeners activos que necesiten ser deshabilitados
2. **Cron Jobs**: Verificar si hay cron jobs configurados en Railway
3. **Webhooks**: Verificar si hay webhooks activos (Stripe, etc.)
4. **Background Tasks**: Verificar si hay tareas en background que se ejecuten automáticamente

---

## ✅ CRITERIOS DE ÉXITO

El sistema se considera correcto SOLO si:

1. ✅ Crear cliente funciona SIEMPRE
2. ✅ No hay errores silenciosos
3. ✅ No hay dependencias ocultas
4. ✅ La base de datos queda consistente
5. ✅ Email único por usuario se valida correctamente
6. ✅ Email se normaliza (lowercase, trim)
7. ✅ Logging registra todos los intentos y errores
8. ✅ No hay jobs ni workers ejecutándose en background
9. ✅ No hay servicios no esenciales activos

---

## 📊 MÉTRICAS DE SIMPLICIDAD

**Antes:**
- ❌ 9+ módulos activos
- ❌ 5+ jobs automáticos
- ❌ 3+ workers en background
- ❌ Sistema de IA activo
- ❌ Monitoreo de precios activo
- ❌ Sistema de notificaciones complejo

**Después (objetivo):**
- ✅ 1 módulo activo: CLIENTES
- ✅ 0 jobs automáticos
- ✅ 0 workers en background
- ✅ 0 IA
- ✅ 0 monitoreo de precios
- ✅ 0 notificaciones emergentes

---

## 🔍 PRÓXIMOS PASOS INMEDIATOS

1. **Revisar routers.ts completo** para identificar todos los endpoints activos
2. **Crear backup** antes de hacer cambios
3. **Deshabilitar jobs y workers** (renombrar archivos)
4. **Comentar endpoints no esenciales** en routers.ts
5. **Implementar validaciones** en endpoint de clientes
6. **Agregar logging** en endpoint de clientes
7. **Simplificar UI** (ocultar páginas no esenciales)
8. **Testing exhaustivo**
9. **Desplegar**

---

**Estado:** 📋 Auditoría completada - Listo para iniciar limpieza
