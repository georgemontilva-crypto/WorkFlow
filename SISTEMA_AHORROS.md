# Sistema de Ahorros (Metas) - Documentación Completa

**Fecha de implementación:** Enero 2026  
**Estado:** ✅ Completado y desplegado

---

## 📋 Resumen Ejecutivo

El sistema de **Ahorros (Metas)** es un módulo completamente independiente que permite a los usuarios definir y rastrear objetivos financieros personales. Cada meta tiene su propia moneda, sin conversiones automáticas ni impactos en los datos financieros de la plataforma.

### Principios Fundamentales

1. **Independencia total** - NO afecta facturas, transacciones ni dashboard financiero
2. **Moneda por meta** - Cada meta tiene SU PROPIA moneda (no usa primary_currency del usuario)
3. **Sin conversiones** - NO hay conversiones automáticas entre monedas
4. **Simplicidad** - Módulo informativo y motivacional, sin efectos colaterales

---

## 🏗️ Arquitectura del Sistema

### Base de Datos

**Tabla: `savings_goals`**
```sql
CREATE TABLE savings_goals (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  target_amount DECIMAL(10,2) NOT NULL,
  current_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  currency VARCHAR(3) NOT NULL, -- NO default, must be explicitly selected
  deadline TIMESTAMP NULL, -- Renamed from target_date
  description TEXT NULL, -- New field
  status ENUM('active', 'completed', 'cancelled') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

**Cambios respecto a la versión anterior:**
- ✅ Removido `.default("USD")` del campo currency
- ✅ Renombrado `target_date` a `deadline`
- ✅ Agregado campo `description`

**Migración:** `/home/ubuntu/WorkFlow/drizzle/migrations/0010_update_savings_goals.sql`

### Backend (tRPC)

**Router:** `trpc.savings.*`

#### Endpoints Implementados

**1. List** (`savings.list`)
- **Input:** `status: 'all' | 'active' | 'completed' | 'cancelled'`
- **Output:** Array de SavingsGoal
- **Logging:** Registra user_id y cantidad de metas encontradas
- **Ubicación:** `/home/ubuntu/WorkFlow/server/routers_savings.ts` líneas 17-51

**2. Get By ID** (`savings.getById`)
- **Input:** `id: number`
- **Output:** SavingsGoal
- **Validación:** Verifica ownership (user_id)
- **Logging:** Registra id y nombre de la meta
- **Ubicación:** líneas 53-90

**3. Create** (`savings.create`)
- **Input:**
  - `name: string` (obligatorio)
  - `target_amount: number` (obligatorio, > 0)
  - `currency: string` (obligatorio, 3 chars, uppercase)
  - `deadline: string` (opcional, ISO date)
  - `description: string` (opcional)
- **Validaciones:**
  - Nombre no vacío
  - Monto objetivo > 0
  - Currency válida (existe en catálogo CURRENCIES)
  - Transform a uppercase automático
- **Logging:** Registra user_id, nombre, monto, moneda validada
- **Ubicación:** líneas 92-160

**4. Update Progress** (`savings.updateProgress`)
- **Input:**
  - `id: number`
  - `current_amount: number` (no negativo)
- **Comportamiento:**
  - Actualiza current_amount
  - Auto-completa si current_amount >= target_amount
  - NO permite valores negativos
- **Logging:** Registra progreso y estado
- **Ubicación:** líneas 162-216

**5. Update** (`savings.update`)
- **Input:**
  - `id: number`
  - `name: string` (opcional)
  - `target_amount: number` (opcional, > 0)
  - `deadline: string` (opcional)
  - `description: string` (opcional)
- **IMPORTANTE:** Currency NO se puede cambiar
- **Logging:** Registra actualización exitosa
- **Ubicación:** líneas 218-274

**6. Delete** (`savings.delete`)
- **Input:** `id: number`
- **Comportamiento:** Soft delete (status = 'cancelled')
- **Logging:** Registra cancelación
- **Ubicación:** líneas 276-315

### Frontend (React + TypeScript)

**Página:** `/home/ubuntu/WorkFlow/client/src/pages/Savings.tsx`

#### Características Implementadas

**1. Listado de Metas**
- Grid responsivo (1-3 columnas según viewport)
- Filtros por status: Todas, Activas, Completadas, Canceladas
- Barra de progreso visual
- Badges de estado (completada/cancelada)
- Muestra: nombre, moneda, progreso, montos, deadline, descripción

**2. Creación de Meta**
- Modal con formulario completo
- Campos:
  - Nombre (obligatorio)
  - Monto objetivo (obligatorio, > 0)
  - Moneda (obligatorio, selector sin default)
  - Deadline (opcional)
  - Descripción (opcional)
- Validación: Currency debe ser explícitamente seleccionada
- Warning: "La moneda NO se puede cambiar después de crear la meta"

**3. Edición de Meta**
- Permite editar: nombre, target_amount, deadline, description
- **NO permite** editar: currency (campo deshabilitado)
- Warning en color ámbar: "La moneda NO se puede cambiar después de crear la meta"

**4. Actualización de Progreso**
- Prompt para agregar monto
- Usa mutation `updateProgress`
- Auto-completa meta si se alcanza el objetivo

**5. Eliminación**
- Confirmación antes de eliminar
- Soft delete (status = 'cancelled')

#### Tipos TypeScript

```typescript
type SavingsGoal = {
  id: number;
  user_id: number;
  name: string;
  target_amount: string;
  current_amount: string;
  currency: string;
  deadline: Date | null;
  description: string | null;
  status: 'active' | 'completed' | 'cancelled';
  created_at: Date;
  updated_at: Date;
};
```

---

## 🔄 Flujos de Usuario

### 1. Crear Meta de Ahorro

```
1. Usuario hace click en "Nueva Meta"
2. Se abre modal con formulario
3. Usuario completa:
   - Nombre: "Vacaciones en Europa"
   - Monto objetivo: 5000
   - Moneda: EUR (DEBE seleccionar explícitamente)
   - Deadline: 2026-12-31 (opcional)
   - Descripción: "Viaje familiar a París" (opcional)
4. Click en "Crear Meta"
5. Backend valida:
   - Nombre no vacío ✓
   - Monto > 0 ✓
   - Currency seleccionada ✓
   - Currency existe en catálogo ✓
6. Meta creada con status='active'
7. Logging: [Savings] Goal created successfully: 123 - Vacaciones en Europa (EUR)
8. Frontend muestra meta en el listado
```

### 2. Actualizar Progreso

```
1. Usuario hace click en "Agregar monto" (o similar)
2. Prompt: "¿Cuánto deseas agregar a esta meta?"
3. Usuario ingresa: 500
4. Backend:
   - current_amount = 0 + 500 = 500
   - Si 500 >= target_amount: status = 'completed'
   - Sino: status = 'active'
5. Logging: [Savings] Progress updated for goal 123: 500/5000 (active)
6. Frontend actualiza barra de progreso
```

### 3. Editar Meta

```
1. Usuario hace click en icono de editar
2. Modal se abre con datos actuales
3. Campo de moneda está DESHABILITADO
4. Warning: "La moneda NO se puede cambiar después de crear la meta"
5. Usuario puede editar:
   - Nombre
   - Monto objetivo
   - Deadline
   - Descripción
6. Click en "Actualizar Meta"
7. Backend actualiza solo los campos permitidos
8. Logging: [Savings] Goal 123 updated successfully
```

### 4. Eliminar Meta

```
1. Usuario hace click en icono de eliminar
2. Confirmación: "¿Estás seguro de que deseas eliminar esta meta?"
3. Usuario confirma
4. Backend: status = 'cancelled' (soft delete)
5. Logging: [Savings] Goal 123 cancelled successfully
6. Frontend oculta la meta del listado (si filtro != 'all')
```

---

## 🧪 Validaciones Implementadas

### Backend (Zod)

**Create:**
```typescript
{
  name: z.string().min(1, "El nombre es obligatorio"),
  target_amount: z.number().positive("El monto objetivo debe ser mayor a 0"),
  currency: z.string()
    .length(3, "El código de moneda debe tener 3 caracteres")
    .toUpperCase(),
  deadline: z.string().optional(),
  description: z.string().optional(),
}
```

**Update Progress:**
```typescript
{
  id: z.number(),
  current_amount: z.number().nonnegative("El monto no puede ser negativo"),
}
```

**Update:**
```typescript
{
  id: z.number(),
  name: z.string().min(1, "El nombre es obligatorio").optional(),
  target_amount: z.number().positive("El monto objetivo debe ser mayor a 0").optional(),
  deadline: z.string().optional(),
  description: z.string().optional(),
}
```

**Validación de Catálogo:**
```typescript
const { CURRENCIES } = await import("../shared/currencies");
const validCurrency = CURRENCIES.find(c => c.code === input.currency);
if (!validCurrency) {
  throw new Error(`Código de moneda inválido: ${input.currency}`);
}
```

### Frontend

- ✅ Nombre no vacío
- ✅ Monto objetivo > 0
- ✅ Currency explícitamente seleccionada (no default)
- ✅ Currency no editable después de crear
- ✅ Confirmación antes de eliminar

---

## 📊 Logging y Monitoreo

### Eventos Registrados

**Create:**
```
[Savings] Create attempt by user 123: { name: 'Vacaciones', target_amount: 5000, currency: 'EUR' }
[Savings] Currency validated: EUR - Euro
[Savings] Goal created successfully: 456 - Vacaciones (EUR)
```

**Update Progress:**
```
[Savings] Update progress for goal 456 by user 123: 500
[Savings] Progress updated for goal 456: 500/5000 (active)
```

**Update:**
```
[Savings] Update attempt for goal 456 by user 123
[Savings] Goal 456 updated successfully
```

**Delete:**
```
[Savings] Delete attempt for goal 456 by user 123
[Savings] Goal 456 cancelled successfully
```

**List:**
```
[Savings] Listing goals for user 123, status: all
[Savings] Found 5 goals for user 123
```

---

## 🎨 Diseño Visual

### Colores del Sistema

- **Background:** `#1a1a1a` (modal), `#222222` (cards)
- **Accent:** `#EBFF57` (lime green) - Progress bar, buttons
- **Orange:** `#FF9500` - Botón "Nueva Meta"
- **Borders:** `gray-800`
- **Text:** `white` / `gray-400`

### Componentes

**Card de Meta:**
```tsx
<div className="bg-[#222222] border border-gray-800 rounded-xl p-6 hover:border-[#EBFF57]/30">
  {/* Header con nombre, moneda, badges */}
  {/* Barra de progreso */}
  {/* Montos (actual/objetivo) */}
  {/* Deadline */}
  {/* Descripción */}
</div>
```

**Barra de Progreso:**
```tsx
<div className="h-2 bg-gray-700 rounded-full overflow-hidden">
  <div 
    className="h-full bg-[#EBFF57] transition-all duration-300"
    style={{ width: `${progress}%` }}
  />
</div>
```

**Badge de Estado:**
```tsx
{/* Completada */}
<span className="px-2 py-0.5 bg-green-500/10 text-green-500 text-xs rounded-full">
  Completada
</span>

{/* Cancelada */}
<span className="px-2 py-0.5 bg-red-500/10 text-red-500 text-xs rounded-full">
  Cancelada
</span>
```

---

## 📁 Archivos Modificados/Creados

### Backend
- ✅ `/drizzle/schema.ts` - Actualización de savingsGoals table
- ✅ `/drizzle/migrations/0010_update_savings_goals.sql` - Migración
- ✅ `/server/routers_savings.ts` - Router completo (NUEVO)
- ✅ `/server/routers.ts` - Registro del savings router

### Frontend
- ✅ `/client/src/pages/Savings.tsx` - Actualización completa

### Shared
- ✅ `/shared/currencies.ts` - Usado para validación

---

## 🚀 Despliegue

### Railway (Auto-deploy)

```bash
git add -A
git commit -m "feat: Implement independent savings system"
git push origin main
```

Railway ejecuta:
1. Build del backend (Node.js + tRPC)
2. Ejecuta migración 0010_update_savings_goals.sql
3. Build del frontend (Vite + React)
4. Restart del servicio

---

## 📈 Métricas de Implementación

### Fases Completadas

1. ✅ **Fase 1:** Modelo de base de datos (schema + migración)
2. ✅ **Fase 2:** Backend tRPC (6 endpoints CRUD)
3. ✅ **Fase 3:** (Skipped - CurrencySelector ya existe)
4. ✅ **Fase 4:** Frontend (listado + creación)
5. ✅ **Fase 5:** Frontend (progreso + edición)
6. ✅ **Fase 6:** Validaciones y logging
7. ✅ **Fase 7:** Testing y documentación

### Estadísticas

- **Commits:** 2 commits principales
- **Archivos modificados:** 4 archivos
- **Archivos nuevos:** 2 archivos (router + migración)
- **Líneas agregadas:** ~700 líneas (código + docs)
- **Endpoints:** 6 endpoints tRPC
- **Tiempo de implementación:** 1 sesión completa

---

## ⚠️ Consideraciones Importantes

### Independencia del Módulo

**CRÍTICO:** El sistema de ahorros es completamente independiente:

- ✅ NO usa datos de facturas
- ✅ NO usa datos de transacciones
- ✅ NO afecta el dashboard financiero
- ✅ NO usa `primary_currency` del usuario
- ✅ NO hay conversiones automáticas

### Moneda por Meta

Cada meta tiene su propia moneda:

```
Usuario tiene:
- Meta 1: "Vacaciones" - 5000 EUR
- Meta 2: "Auto nuevo" - 30000 USD
- Meta 3: "Fondo emergencia" - 100000 MXN

Resultado:
- Cada meta se muestra en su propia moneda
- NO hay conversión EUR → USD → MXN
- Son objetivos independientes
```

### Cambio de Moneda

**IMPORTANTE:** La moneda NO se puede cambiar después de crear la meta.

**Razón:** Evitar confusión y mantener consistencia histórica.

**Solución:** Si el usuario necesita cambiar la moneda, debe:
1. Crear una nueva meta con la moneda correcta
2. Cancelar la meta antigua

---

## 🆘 Troubleshooting

### Problema: Error "Debe seleccionar una moneda"

**Causa:** Usuario intentó crear meta sin seleccionar moneda  
**Solución:** El campo currency NO tiene default. Usuario DEBE seleccionar explícitamente.

### Problema: No puedo cambiar la moneda de una meta

**Causa:** Currency está deshabilitado en modo edición  
**Solución:** Esto es intencional. La moneda no se puede cambiar después de crear la meta.

### Problema: Mi meta no se completa automáticamente

**Causa:** El status solo cambia a 'completed' cuando current_amount >= target_amount  
**Solución:** Usar `updateProgress` para actualizar el monto. El backend auto-completa si se alcanza el objetivo.

### Problema: Las metas no aparecen en el dashboard financiero

**Causa:** Las metas de ahorro son independientes del dashboard financiero  
**Solución:** Esto es intencional. Las metas NO afectan ni se muestran en Finances.

---

## 🔮 Futuras Mejoras (Opcionales)

### Corto Plazo
- [ ] Agregar gráfico de progreso histórico
- [ ] Notificaciones cuando se alcanza una meta
- [ ] Exportar metas a PDF

### Mediano Plazo
- [ ] Agregar aportes programados (automáticos)
- [ ] Categorías de metas (viajes, educación, emergencia, etc.)
- [ ] Compartir metas con otros usuarios

### Largo Plazo
- [ ] Integración con alertas del sistema
- [ ] Recomendaciones de ahorro basadas en ingresos
- [ ] Análisis de viabilidad de metas

---

## 📞 Contacto y Soporte

Para preguntas o problemas relacionados con el sistema de ahorros:
- **Documentación:** Este archivo
- **Logs:** Revisar logs de Railway para errores
- **Código:** Repositorio GitHub `georgemontilva-crypto/WorkFlow`

---

**Última actualización:** Enero 2026  
**Versión del documento:** 1.0  
**Estado del sistema:** ✅ Producción
