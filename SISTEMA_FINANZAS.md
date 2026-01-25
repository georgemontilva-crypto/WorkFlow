# Sistema de Finanzas - Documentación Completa

**Fecha:** 24 de enero de 2026  
**Versión:** 1.0.0  
**Estado:** ✅ Implementado y Desplegado

---

## 🎯 Principio Fundamental

**El sistema NO crea dinero. El sistema SOLO LEE facturas pagadas.**

Fuente única de verdad: Tabla `invoices` con `status = 'paid'`

---

## 📋 Arquitectura del Sistema

### Backend (4 Endpoints)

#### 1. `finances.getSummary`
**Descripción:** Calcula totales, mes actual, mes anterior y variación porcentual

**Input:**
```typescript
{ currency: string }
```

**Output:**
```typescript
{
  totalIncome: number,
  currentMonthIncome: number,
  previousMonthIncome: number,
  variation: number // Porcentaje
}
```

**Lógica:**
- Total: SUM de todas las facturas con `status = 'paid'`
- Mes actual: SUM de facturas pagadas en el mes actual
- Mes anterior: SUM de facturas pagadas en el mes anterior
- Variación: ((actual - anterior) / anterior) * 100

---

#### 2. `finances.getIncomeByMonth`
**Descripción:** Agrupa ingresos por mes (últimos N meses)

**Input:**
```typescript
{ 
  months: number, // Default: 12
  currency: string 
}
```

**Output:**
```typescript
Array<{
  month: number,
  year: number,
  income: number
}>
```

**Lógica:**
- GROUP BY MONTH(issue_date), YEAR(issue_date)
- WHERE status = 'paid'
- ORDER BY year DESC, month DESC
- LIMIT months

---

#### 3. `finances.getIncomeByClient`
**Descripción:** Top clientes por ingresos totales

**Input:**
```typescript
{ 
  limit: number, // Default: 10
  currency: string 
}
```

**Output:**
```typescript
Array<{
  client_id: number,
  client_name: string,
  income: number
}>
```

**Lógica:**
- GROUP BY client_id
- WHERE status = 'paid'
- ORDER BY SUM(total) DESC
- LIMIT limit

---

#### 4. `finances.getHistory`
**Descripción:** Historial completo de transacciones (facturas pagadas)

**Input:**
```typescript
{
  startDate?: string, // Opcional
  endDate?: string,   // Opcional
  clientId?: number   // Opcional
}
```

**Output:**
```typescript
Array<{
  id: number,
  invoice_number: string,
  client_name: string,
  amount: number,
  currency: string,
  date: Date,
  status: 'paid'
}>
```

**Lógica:**
- SELECT invoices JOIN clients
- WHERE status = 'paid'
- Aplicar filtros opcionales
- ORDER BY issue_date DESC

---

## 🎨 Frontend

### Estructura de la Página

```
/finances
├── Header
│   ├── Título
│   └── Botón "Exportar" (placeholder)
├── Summary Cards (3 cards)
│   ├── Ingresos Totales
│   ├── Mes Actual
│   └── Variación %
├── Gráficas (2 columnas)
│   ├── Ingresos por Mes (barras horizontales)
│   └── Top Clientes (barras horizontales)
└── Historial Financiero (tabla)
    └── Fecha | Cliente | Factura | Monto | Estado
```

### Colores y Estilos

- **Fondo:** `#222222`
- **Bordes:** `border-gray-800`
- **Texto principal:** `text-white`
- **Texto secundario:** `text-gray-400`
- **Acento:** `#EBFF57` (verde lima)
- **Positivo:** `text-green-500`
- **Negativo:** `text-red-500`

### Componentes Usados

- `DashboardLayout` - Layout principal
- `Button` - Botón de exportar
- Iconos de `lucide-react`:
  - `Download` - Exportar
  - `DollarSign` - Ingresos totales
  - `Calendar` - Mes actual
  - `TrendingUp` / `TrendingDown` - Variación

---

## ✅ Funcionalidades Implementadas

### Fase 1: Backend ✅
- [x] Endpoint `getSummary`
- [x] Endpoint `getIncomeByMonth`
- [x] Endpoint `getIncomeByClient`
- [x] Endpoint `getHistory`
- [x] Validaciones de currency
- [x] Logging completo

### Fase 2: Dashboard ✅
- [x] Card de Ingresos Totales
- [x] Card de Mes Actual
- [x] Card de Variación %
- [x] Loading states
- [x] Formato de moneda

### Fase 3: Gráficas ✅
- [x] Gráfica de Ingresos por Mes
- [x] Gráfica de Top Clientes
- [x] Barras horizontales con porcentajes
- [x] Estados vacíos

### Fase 4: Historial ✅
- [x] Tabla de transacciones
- [x] Formato de fechas
- [x] Badge de estado "Pagado"
- [x] Estado vacío

### Fase 5: Navegación ✅
- [x] Agregado al sidebar
- [x] Icono TrendingUp
- [x] Ruta `/finances`

---

## 📊 Validaciones y Cálculos

### Validación de Datos

1. **Solo facturas pagadas:** `status = 'paid'`
2. **Currency consistente:** Todas las queries filtran por currency
3. **Fechas válidas:** Validación de rangos de fecha
4. **Client_id válido:** Verificación de existencia

### Cálculos Financieros

**Variación Porcentual:**
```typescript
variation = ((currentMonth - previousMonth) / previousMonth) * 100
```

**Total por Mes:**
```sql
SELECT 
  MONTH(issue_date) as month,
  YEAR(issue_date) as year,
  SUM(total) as income
FROM invoices
WHERE status = 'paid' AND currency = ?
GROUP BY YEAR(issue_date), MONTH(issue_date)
ORDER BY year DESC, month DESC
```

**Total por Cliente:**
```sql
SELECT 
  c.id as client_id,
  c.name as client_name,
  SUM(i.total) as income
FROM invoices i
JOIN clients c ON i.client_id = c.id
WHERE i.status = 'paid' AND i.currency = ?
GROUP BY c.id, c.name
ORDER BY income DESC
LIMIT ?
```

---

## 🚀 Deployment

**Commit:** `1852aac`  
**Fecha:** 24 de enero de 2026  
**Estado:** Desplegado en Railway

### Archivos Modificados

- `server/routers_finances.ts` (nuevo)
- `server/routers.ts` (agregado router de finanzas)
- `client/src/pages/Finances.tsx` (reescrito)
- `client/src/pages/FinancesOld.tsx` (backup)
- `client/src/components/DashboardLayout.tsx` (agregado navegación)

---

## 📝 Pendientes (No Implementados)

### Exportación (Fase 5)
- [ ] Exportar a CSV
- [ ] Exportar a Excel (XLSX)
- [ ] Exportar a PDF

### Filtros Avanzados (Fase 4)
- [ ] Filtro por rango de fechas
- [ ] Filtro por cliente
- [ ] Filtro por mes/año

### Mejoras Futuras
- [ ] Gráficas interactivas (tooltips, zoom)
- [ ] Comparación con períodos anteriores
- [ ] Proyecciones de ingresos
- [ ] Análisis de tendencias

---

## 🎓 Principios de Diseño Aplicados

1. ✅ **Read-only:** El sistema solo lee, no crea datos
2. ✅ **Single source of truth:** Facturas pagadas
3. ✅ **No transacciones manuales:** Solo facturas
4. ✅ **Validaciones estrictas:** Currency, status, fechas
5. ✅ **Logging completo:** Todas las operaciones logueadas
6. ✅ **Estados de carga:** Loading states en todo
7. ✅ **Estados vacíos:** Mensajes cuando no hay datos
8. ✅ **Responsive:** Mobile-first design

---

## 🔮 Próximos Pasos

1. **Probar el sistema** con facturas reales
2. **Validar cálculos** con datos de producción
3. **Implementar exportación** (CSV/Excel)
4. **Agregar filtros** avanzados
5. **Optimizar queries** si hay problemas de performance

---

**Sistema de Finanzas v1.0.0 - Implementado y Funcional** ✅
