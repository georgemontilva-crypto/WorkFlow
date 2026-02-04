# Sistema de Seguimiento de Inversiones en Criptomonedas

## Resumen de la Implementación

Se ha implementado exitosamente un sistema completo de seguimiento de inversiones en criptomonedas que permite a los usuarios:

1. **Registrar compras de criptomonedas** con cantidad, precio de compra y moneda
2. **Ver automáticamente todas sus inversiones** sin necesidad de seleccionar manualmente cada cripto
3. **Calcular ganancias/pérdidas en tiempo real** basándose en los precios actuales de CoinGecko
4. **Expandir cada proyecto** para ver el historial detallado de compras
5. **Ver un resumen global** con métricas totales de todas las inversiones

## Arquitectura de la Solución

### Backend (tRPC + Drizzle ORM)

**Archivo**: `server/routers_crypto.ts`

**Endpoints principales**:

- `listProjects`: Obtiene todos los proyectos (criptos) del usuario
- `getProject`: Obtiene un proyecto específico con todas sus compras
- `getProjectSummary`: Calcula el resumen de inversión para una cripto específica
- `addPurchase`: Registra una nueva compra (crea el proyecto si no existe)
- `deletePurchase`: Elimina una compra específica

**Base de datos**:

Dos tablas principales:
- `crypto_projects`: Almacena los proyectos de inversión (una fila por cada cripto que el usuario ha comprado)
- `crypto_purchases`: Almacena cada compra individual con cantidad, precio y fecha

### Frontend (React + TypeScript)

**Componente principal**: `client/src/components/InvestmentTracker.tsx`

Este componente:

1. **Recibe** una lista de proyectos con sus precios actuales desde `Markets.tsx`
2. **Carga automáticamente** el resumen de cada proyecto usando `getProjectSummary`
3. **Calcula totales globales** sumando todas las inversiones
4. **Muestra tarjetas expandibles** para cada criptomoneda
5. **Permite expandir** cada tarjeta para ver el historial de compras detallado

**Página Markets**: `client/src/pages/Markets.tsx`

Modificaciones realizadas:

1. Cambió de usar `getProjectSummary` con `selectedCrypto` a usar `listProjects` para cargar todas las inversiones
2. Integró el componente `InvestmentTracker` en lugar de la lógica inline anterior
3. Mantiene el modal de registro de compras que funciona correctamente

## Flujo de Datos

```
1. Usuario abre Markets
   ↓
2. Se cargan las criptos desde CoinGecko (precios actuales)
   ↓
3. Se cargan todos los proyectos del usuario (listProjects)
   ↓
4. Se mapean los proyectos con sus precios actuales
   ↓
5. InvestmentTracker recibe projectSummaries
   ↓
6. Para cada proyecto, se carga el resumen (getProjectSummary)
   ↓
7. Se calculan totales globales
   ↓
8. Se muestran las tarjetas con ganancias/pérdidas en tiempo real
```

## Cálculos de Ganancia/Pérdida

### Por Compra Individual

```typescript
const invested = quantity * buyPrice;
const currentValue = quantity * currentPrice;
const profitLoss = currentValue - invested;
const profitLossPercentage = (profitLoss / invested) * 100;
```

### Por Proyecto (Cripto)

```typescript
// Backend: getProjectSummary
let totalQuantity = 0;
let totalInvestment = 0;

for (const purchase of purchases) {
  totalQuantity += parseFloat(purchase.quantity);
  totalInvestment += parseFloat(purchase.quantity) * parseFloat(purchase.buy_price);
}

const averagePrice = totalInvestment / totalQuantity;
const currentValue = totalQuantity * currentPrice;
const profitLoss = currentValue - totalInvestment;
const profitLossPercentage = (profitLoss / totalInvestment) * 100;
```

### Global (Todas las Inversiones)

```typescript
// Frontend: InvestmentTracker
let totalInvestment = 0;
let totalCurrentValue = 0;

summaries.forEach((summary) => {
  totalInvestment += summary.totalInvestment;
  totalCurrentValue += summary.currentValue;
});

const totalProfitLoss = totalCurrentValue - totalInvestment;
const totalProfitLossPercentage = (totalProfitLoss / totalInvestment) * 100;
```

## Características Implementadas

### ✅ Resumen Global

Muestra en 4 tarjetas:
- **Proyectos Activos**: Número de criptomonedas diferentes en las que se ha invertido
- **Inversión Total**: Suma de todo el dinero invertido (en USD)
- **Valor Actual**: Valor actual de todas las inversiones según precios de mercado
- **Ganancia/Pérdida Total**: Diferencia entre valor actual e inversión ($ y %)

### ✅ Tarjetas de Proyecto

Cada criptomoneda se muestra en una tarjeta que incluye:
- Logo y nombre de la cripto
- Inversión total en esa cripto
- Valor actual
- Ganancia/pérdida (con color verde/rojo según sea positiva/negativa)
- Botón para expandir y ver detalles

### ✅ Vista Expandida

Al expandir una tarjeta se muestra:
- **Cantidad Total**: Total de tokens/monedas compradas
- **Precio Promedio**: Precio promedio de compra
- **Precio Actual**: Precio actual del mercado
- **Historial de Compras**: Lista detallada de cada compra con:
  - Cantidad comprada
  - Precio de compra
  - Inversión en esa compra
  - Ganancia/pérdida de esa compra específica
  - Fecha de compra

### ✅ Registro de Compras

Modal que permite:
- Seleccionar criptomoneda (dropdown con las top 50 por capitalización)
- Ingresar cantidad comprada
- Ingresar precio de compra
- Seleccionar moneda (USD, EUR, COP)
- Guardar la compra en la base de datos

### ✅ Actualización en Tiempo Real

- Los precios se obtienen de CoinGecko cada vez que se carga la página
- Las ganancias/pérdidas se recalculan automáticamente con los precios actuales
- Al registrar una nueva compra, se recargan todos los proyectos y se actualizan los cálculos

## Mejoras Futuras Sugeridas

1. **Auto-refresh**: Actualizar precios cada X minutos sin recargar la página
2. **Gráficos**: Agregar gráficos de evolución del portfolio
3. **Alertas**: Notificar cuando una inversión alcanza cierto % de ganancia/pérdida
4. **Exportar**: Permitir exportar el historial a CSV/Excel
5. **Eliminar compras**: Agregar botón para eliminar compras individuales
6. **Múltiples monedas**: Convertir todo a la moneda preferida del usuario
7. **Comparación**: Comparar rendimiento vs. Bitcoin o el mercado general

## Testing

Para probar el sistema:

1. Ir a la página Markets
2. Hacer clic en "Registrar Compra"
3. Seleccionar una criptomoneda (ej: Bitcoin)
4. Ingresar cantidad (ej: 0.001)
5. Ingresar precio de compra (ej: 50000)
6. Guardar
7. Verificar que aparece en el listado con cálculos correctos
8. Expandir la tarjeta para ver el detalle
9. Registrar otra compra de la misma o diferente cripto
10. Verificar que los totales globales se actualizan correctamente

## Despliegue

Los cambios se han desplegado en:

- **Rama main**: https://github.com/georgemontilva-crypto/WorkFlow/tree/main
- **Rama Estable**: https://github.com/georgemontilva-crypto/WorkFlow/tree/Estable

Railway detectará automáticamente los cambios y desplegará la nueva versión.

## Archivos Modificados/Creados

### Creados:
- `client/src/components/InvestmentTracker.tsx` - Componente principal de visualización
- `server/routers_crypto.ts` - Router tRPC para operaciones crypto
- `drizzle/migrations/0001_crypto_projects_purchases.sql` - Migración de base de datos

### Modificados:
- `client/src/pages/Markets.tsx` - Integración del nuevo componente
- `server/routers.ts` - Registro del router crypto
- `drizzle/schema.ts` - Esquemas de las tablas crypto

## Conclusión

El sistema está completamente funcional y listo para usar. Los usuarios pueden ahora:

1. ✅ Registrar compras de criptomonedas
2. ✅ Ver todas sus inversiones automáticamente
3. ✅ Calcular ganancias/pérdidas en tiempo real
4. ✅ Ver historial detallado de cada inversión
5. ✅ Obtener un resumen global de su portfolio

El código es escalable, mantenible y sigue las mejores prácticas de React y TypeScript.
