# Sistema de Moneda Principal - Documentación Completa

**Fecha de implementación:** Enero 2026  
**Estado:** ✅ Completado y desplegado

---

## 📋 Resumen Ejecutivo

El sistema de **Moneda Principal** establece que cada usuario tiene UNA sola moneda que sirve como referencia global en toda la plataforma. Esta moneda se selecciona durante el registro y puede cambiarse en Settings, pero NO se realizan conversiones automáticas de datos históricos.

### Principios Fundamentales

1. **Una moneda por usuario** - Single source of truth
2. **Sin conversiones automáticas** - Los datos históricos mantienen su moneda original
3. **Simplicidad y predictibilidad** - El usuario siempre sabe qué moneda está usando
4. **Consistencia** - La misma moneda en facturas, dashboard y reportes

---

## 🏗️ Arquitectura del Sistema

### Base de Datos

**Tabla: `users`**
```sql
primary_currency VARCHAR(3) NOT NULL DEFAULT 'USD'
```

- **Tipo:** VARCHAR(3) - Código ISO 4217
- **Restricción:** NOT NULL - Siempre tiene un valor
- **Default:** 'USD' - Valor por defecto para nuevos usuarios
- **Ubicación:** `/home/ubuntu/WorkFlow/drizzle/schema.ts` línea 45

### Backend (tRPC)

#### Endpoints Implementados

**1. Signup** (`auth.signup`)
- **Input:** `primaryCurrency: string (3 chars, uppercase, default: USD)`
- **Validaciones:**
  - Longitud exacta de 3 caracteres
  - Transform a uppercase automático
  - Validación contra catálogo CURRENCIES
- **Logging:** Registra email, moneda validada y nombre
- **Ubicación:** `/home/ubuntu/WorkFlow/server/routers.ts` líneas 30-96

**2. Update Primary Currency** (`auth.updatePrimaryCurrency`)
- **Input:** `currency: string (3 chars, uppercase)`
- **Validaciones:**
  - Longitud exacta de 3 caracteres
  - Transform a uppercase automático
  - Validación contra catálogo CURRENCIES
- **Logging:** Registra user_id, cambio anterior->nuevo, nombre de moneda
- **Ubicación:** `/home/ubuntu/WorkFlow/server/routers.ts` líneas 522-556

**3. Create Invoice** (`invoices.create`)
- **Comportamiento:** Auto-asigna `primary_currency` del usuario
- **No requiere input de moneda**
- **Logging:** Registra invoice_number y currency asignada
- **Ubicación:** `/home/ubuntu/WorkFlow/server/routers_invoices.ts` líneas 167-171

**4. Finances Queries** (`finances.*`)
- **Filtrado:** Todas las queries aceptan `currency` como parámetro opcional
- **Comportamiento:** Filtra facturas pagadas por moneda
- **Ubicación:** `/home/ubuntu/WorkFlow/server/routers_finances.ts`

#### Función de Base de Datos

**`updateUserPrimaryCurrency(user_id, currency)`**
- Actualiza el campo `primary_currency` del usuario
- Actualiza `updated_at` automáticamente
- **Ubicación:** `/home/ubuntu/WorkFlow/server/db.ts` líneas 270-290

### Frontend (React + TypeScript)

#### Componentes Implementados

**1. CurrencySelector** (`/components/CurrencySelector.tsx`)
- Selector con búsqueda de 81 monedas
- Dialog modal con lista scrollable
- Búsqueda por código o nombre
- Muestra código, nombre y checkmark de selección
- **Props:**
  - `selectedCurrency: string`
  - `onSelect: (code: string) => void`
  - `label?: string`
  - `required?: boolean`
  - `error?: string`

**2. Signup** (`/pages/Signup.tsx`)
- Incluye selector de moneda (requerido)
- Default: USD
- Envía `primaryCurrency` al backend
- **Estado:** `primaryCurrency: string`

**3. Settings** (`/pages/Settings.tsx`)
- Card "Moneda Principal" en grid 2x2
- Muestra moneda actual con badge
- Permite cambiar moneda con warning
- **Warning:** "Cambiar la moneda NO recalcula los datos históricos"
- **Mutation:** `trpc.auth.updatePrimaryCurrency.useMutation()`
- Recarga la página después del cambio exitoso

**4. Invoices** (`/pages/Invoices.tsx`)
- Badge informativo de moneda en formulario de creación
- Muestra: nombre, símbolo y código
- Mensaje: "La moneda se asigna automáticamente desde tu perfil"
- **No permite** seleccionar moneda (readonly)

**5. Finances** (`/pages/Finances.tsx`)
- Badge de moneda en header del dashboard
- Filtra todos los datos por `primary_currency` del usuario
- Usa `formatCurrency` de la librería compartida
- Muestra símbolo y código en el header

### Librería Compartida

**`shared/currencies.ts`**
- **81 monedas** soportadas (Americas, Europe, Asia-Pacific, Middle East & Africa)
- **Interface Currency:**
  ```typescript
  {
    code: string;      // Código ISO (USD, EUR, MXN, etc.)
    name: string;      // Nombre completo
    symbol: string;    // Símbolo ($, €, £, etc.)
    locale: string;    // Locale para formateo (en-US, es-MX, etc.)
  }
  ```
- **Funciones:**
  - `getCurrency(code)` - Obtiene moneda por código
  - `getCurrencySymbol(code)` - Obtiene solo el símbolo
  - `formatCurrency(amount, code)` - Formatea monto con Intl.NumberFormat
  - `getCurrencyOptions()` - Array para selects
  - `DEFAULT_CURRENCY = 'USD'`

---

## 🔄 Flujos de Usuario

### 1. Registro de Nuevo Usuario

```
1. Usuario completa formulario de signup
2. Selecciona moneda principal (requerido)
3. Backend valida:
   - Código de 3 caracteres
   - Existe en catálogo CURRENCIES
   - Transform a uppercase
4. Se crea usuario con primary_currency
5. Logging: email, moneda validada
```

### 2. Cambio de Moneda en Settings

```
1. Usuario abre Settings
2. Ve card "Moneda Principal" con moneda actual
3. Click en "Cambiar Moneda"
4. Sistema muestra warning sobre datos históricos
5. Usuario selecciona nueva moneda
6. Click en "Confirmar Cambio"
7. Backend valida y actualiza
8. Logging: user_id, cambio anterior->nuevo
9. Frontend recarga la página
10. Todos los nuevos datos usan la nueva moneda
```

### 3. Creación de Factura

```
1. Usuario abre modal de crear factura
2. Ve badge informativo con su moneda
3. Completa formulario (sin selector de moneda)
4. Backend auto-asigna primary_currency del usuario
5. Factura se crea con la moneda del usuario
6. Logging: invoice_number, currency
```

### 4. Dashboard Financiero

```
1. Usuario abre Finances
2. Sistema obtiene primary_currency del usuario
3. Filtra todas las queries por esa moneda
4. Muestra badge con símbolo y código
5. Todos los montos usan formatCurrency correcto
6. Solo se muestran facturas en esa moneda
```

---

## 🧪 Testing y Validaciones

### Validaciones Implementadas

#### Backend (Zod)

**Signup:**
```typescript
primaryCurrency: z.string()
  .length(3, "Currency code must be 3 characters")
  .toUpperCase()
  .default("USD")
```

**Update:**
```typescript
currency: z.string()
  .length(3, "Currency code must be 3 characters")
  .toUpperCase()
```

**Validación de Catálogo:**
```typescript
const { CURRENCIES } = await import("../shared/currencies");
const validCurrency = CURRENCIES.find(c => c.code === input.primaryCurrency);
if (!validCurrency) {
  throw new Error(`Invalid currency code: ${input.primaryCurrency}`);
}
```

#### Base de Datos

- **NOT NULL:** Campo nunca puede ser null
- **DEFAULT 'USD':** Siempre tiene un valor
- **VARCHAR(3):** Restricción de longitud

### Casos de Prueba

✅ **Registro con moneda válida** (USD, EUR, MXN, etc.)  
✅ **Registro sin seleccionar moneda** (usa default USD)  
✅ **Cambio de moneda en Settings**  
✅ **Creación de factura con moneda auto-asignada**  
✅ **Dashboard filtra por moneda del usuario**  
✅ **Validación de código inválido** (error descriptivo)  
✅ **Transform a uppercase** (usd → USD)  
✅ **Logging completo** en todas las operaciones

---

## 📊 Logging y Monitoreo

### Eventos Registrados

**Signup:**
```
[Auth] Signup attempt: user@example.com
[Auth] Currency validated: USD - Dólar estadounidense
[Auth] User created: 123
```

**Update Currency:**
```
[Auth] Currency change request from user 123: USD -> EUR
[Auth] Currency validated: EUR - Euro
[Auth] Primary currency updated successfully for user 123: EUR
```

**Create Invoice:**
```
[Invoices] Create attempt by user 123: { client_id: 45, items_count: 3 }
[Invoices] Invoice number: INV-20260124-1234, currency: USD
[Invoices] Invoice 789 created successfully
```

**Finances:**
```
[Finances] Getting summary for user: 123
[Finances] Found 25 invoices for user: 123
```

---

## 🎨 Diseño Visual

### Colores del Sistema

- **Background:** `#222222` (dark gray)
- **Accent:** `#EBFF57` (lime green)
- **Borders:** `gray-800`
- **Text:** `white` / `gray-400`

### Componentes de Moneda

**Badge de Moneda:**
```tsx
<Badge className="bg-[#EBFF57]/10 text-[#EBFF57] border border-[#EBFF57]/30">
  $ USD
</Badge>
```

**Card Informativa:**
```tsx
<div className="p-3 bg-[#EBFF57]/10 border border-[#EBFF57]/30 rounded-lg">
  <p className="text-sm font-medium text-white">Dólar estadounidense</p>
  <Badge>$ USD</Badge>
</div>
```

**Warning:**
```tsx
<div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
  <AlertCircle className="text-amber-500" />
  <p>Advertencia Importante</p>
  <p>Cambiar la moneda NO recalcula los datos históricos...</p>
</div>
```

---

## 📁 Archivos Modificados

### Backend
- `/home/ubuntu/WorkFlow/server/routers.ts` - Endpoints signup y updatePrimaryCurrency
- `/home/ubuntu/WorkFlow/server/routers_invoices.ts` - Auto-asignación de moneda
- `/home/ubuntu/WorkFlow/server/routers_finances.ts` - Filtrado por moneda
- `/home/ubuntu/WorkFlow/server/db.ts` - Función updateUserPrimaryCurrency
- `/home/ubuntu/WorkFlow/drizzle/schema.ts` - Campo primary_currency

### Frontend
- `/home/ubuntu/WorkFlow/client/src/pages/Signup.tsx` - Selector de moneda
- `/home/ubuntu/WorkFlow/client/src/pages/Settings.tsx` - Card de cambio de moneda
- `/home/ubuntu/WorkFlow/client/src/pages/Invoices.tsx` - Badge informativo
- `/home/ubuntu/WorkFlow/client/src/pages/Finances.tsx` - Filtrado y badge
- `/home/ubuntu/WorkFlow/client/src/components/CurrencySelector.tsx` - Componente reutilizable

### Shared
- `/home/ubuntu/WorkFlow/shared/currencies.ts` - Catálogo de 81 monedas

---

## 🚀 Despliegue

### Railway (Auto-deploy)

El sistema se despliega automáticamente en Railway cuando se hace push a `main`:

```bash
git add -A
git commit -m "feat: Currency system implementation"
git push origin main
```

Railway detecta el push y ejecuta:
1. Build del backend (Node.js + tRPC)
2. Build del frontend (Vite + React)
3. Restart del servicio
4. Actualización en producción

### Variables de Entorno

No se requieren nuevas variables de entorno para el sistema de moneda.

---

## 📈 Métricas de Implementación

### Fases Completadas

1. ✅ **Fase 1:** Campo primary_currency en users table
2. ✅ **Fase 2:** Migración de usuarios existentes a USD
3. ✅ **Fase 3:** Selector de moneda en registro
4. ✅ **Fase 4:** Configuración de moneda en Settings
5. ✅ **Fase 5:** Integración en creación de facturas
6. ✅ **Fase 6:** Integración en dashboard financiero
7. ✅ **Fase 7:** Validaciones y logging completo
8. ✅ **Fase 8:** Testing y documentación

### Estadísticas

- **Commits:** 5 commits específicos del sistema de moneda
- **Archivos modificados:** 10 archivos
- **Líneas agregadas:** ~400 líneas
- **Monedas soportadas:** 81 monedas globales
- **Tiempo de implementación:** 1 sesión completa

---

## 🔮 Futuras Mejoras (Opcionales)

### Corto Plazo
- [ ] Exportar reportes en PDF con moneda del usuario
- [ ] Agregar filtro de moneda en historial de facturas
- [ ] Mostrar advertencia si hay facturas en múltiples monedas

### Mediano Plazo
- [ ] Soporte para múltiples monedas por usuario (avanzado)
- [ ] Conversión de datos históricos (con confirmación explícita)
- [ ] Gráficos de variación de moneda en el tiempo

### Largo Plazo
- [ ] Integración con APIs de tasas de cambio
- [ ] Reportes multi-moneda con conversión automática
- [ ] Alertas de fluctuación de moneda

---

## ⚠️ Consideraciones Importantes

### Datos Históricos

**IMPORTANTE:** Cambiar la moneda del usuario NO recalcula los datos históricos. Las facturas y transacciones existentes mantienen su moneda original.

**Ejemplo:**
```
Usuario tiene:
- 10 facturas en USD (creadas antes del cambio)
- Cambia su moneda a EUR
- Crea 5 facturas nuevas en EUR

Resultado:
- Dashboard muestra solo las 5 facturas en EUR
- Las 10 facturas en USD siguen existiendo pero no se muestran
- No hay conversión automática USD → EUR
```

### Recomendaciones

1. **Seleccionar moneda correcta desde el inicio** - Evita cambios futuros
2. **Advertir al usuario** - Mostrar warning claro al cambiar moneda
3. **No mezclar monedas** - Mantener consistencia en todas las facturas
4. **Documentar cambios** - El logging registra todos los cambios de moneda

---

## 🆘 Troubleshooting

### Problema: Usuario no ve sus facturas antiguas

**Causa:** Cambió de moneda y las facturas antiguas están en otra moneda  
**Solución:** El dashboard filtra por moneda actual. Las facturas antiguas siguen en la BD pero no se muestran.

### Problema: Error "Invalid currency code"

**Causa:** Código de moneda no existe en el catálogo CURRENCIES  
**Solución:** Verificar que el código sea válido (3 caracteres, uppercase, en el catálogo)

### Problema: Moneda no se actualiza en el frontend

**Causa:** El frontend cachea los datos del usuario  
**Solución:** La aplicación recarga automáticamente después de cambiar la moneda

---

## 📞 Contacto y Soporte

Para preguntas o problemas relacionados con el sistema de moneda:
- **Documentación:** Este archivo
- **Logs:** Revisar logs de Railway para errores
- **Código:** Repositorio GitHub `georgemontilva-crypto/WorkFlow`

---

**Última actualización:** Enero 2026  
**Versión del documento:** 1.0  
**Estado del sistema:** ✅ Producción
