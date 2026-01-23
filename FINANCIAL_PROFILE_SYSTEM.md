# Sistema de Perfil Financiero y Alertas Personalizadas

## Descripción General

El sistema de Perfil Financiero convierte la configuración del perfil empresarial en un componente activo que personaliza automáticamente alertas, métricas y copy según el tipo de actividad del usuario y sus objetivos financieros.

---

## Arquitectura

### 1. Base de Datos

#### Nuevos Campos en `company_profiles`:

```sql
business_type VARCHAR(20)           -- 'freelancer', 'empresa', 'agencia'
base_currency VARCHAR(3)            -- 'USD', 'EUR', 'VES', etc.
monthly_income_goal DECIMAL(10,2)   -- Objetivo mensual de ingresos
goal_currency VARCHAR(3)            -- Moneda del objetivo (por defecto = base_currency)
```

#### Migración SQL:

```bash
# Ejecutar en TablePlus o Railway:
/home/ubuntu/project/migration_add_financial_profile.sql
```

---

### 2. Backend

#### **Endpoint Actualizado: `companyProfile.upsert`**

```typescript
// Ahora acepta campos financieros
{
  // ... campos existentes ...
  business_type?: 'freelancer' | 'empresa' | 'agencia',
  base_currency?: string,
  monthly_income_goal?: number,
  goal_currency?: string,
}
```

#### **Servicio: `financial-alerts-service.ts`**

**Funciones principales:**

- `generateFinancialAlerts(userId)`: Genera alertas personalizadas basadas en progreso
- `calculateMonthlyProgress(userId)`: Calcula progreso hacia objetivo mensual
- `getPersonalizedCopy(businessType, context)`: Personaliza texto según tipo de negocio
- `formatCurrency(amount, currency)`: Formatea montos con símbolo correcto

**Lógica de Alertas:**

| Progreso | Tipo | Prioridad | Toast | Mensaje |
|----------|------|-----------|-------|---------|
| < 50% | - | - | No | Sin alerta |
| 50-74% | info | medium | Sí | "Has facturado $X de $Y este mes" |
| 75-99% | success | medium | Sí | "¡Excelente! Has facturado $X de $Y" |
| 100-109% | success | high | Sí | "¡Felicitaciones! Has alcanzado tu objetivo" |
| ≥ 110% | success | high | Sí | "¡Increíble! Has superado tu objetivo en X%" |
| Fin de mes < 100% | warning | high | Sí | "Quedan pocos días. Faltan $X" |

**Personalización por Tipo de Negocio:**

```typescript
freelancer: "facturado", "Progreso de Facturación"
empresa:    "ingresado", "Progreso de Ingresos"
agencia:    "facturado", "Progreso de Facturación"
```

#### **Integración con `alert-service.ts`**

Nueva función: `generateFinancialGoalAlerts(user_id)`

- Verifica si el perfil financiero está completo
- Genera alertas personalizadas
- Crea registros en la tabla `alerts`
- Se ejecuta automáticamente al:
  - Marcar factura como pagada
  - Confirmar pago
  - Cron job diario (recomendado)

---

### 3. Frontend

#### **Página: `CompanyProfile.tsx`**

**Estructura Reorganizada:**

```
┌─────────────────────────────────────────────────────────┐
│ Header: "Perfil Empresarial" + Botón "Guardar Cambios" │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ Progress Indicator Card                                  │
│ - Barra de progreso general (X%)                        │
│ - Sub-progreso: Identidad (X/4) + Financiero (X/3)     │
│ - Alerta si incompleto                                  │
└─────────────────────────────────────────────────────────┘

┌──────────────────────────┬──────────────────────────────┐
│ Bloque 1: Identidad      │ Bloque 2: Perfil Financiero  │
│ - Logo/Foto              │ - Moneda Base *              │
│ - Nombre Comercial *     │ - Objetivo Mensual           │
│ - Tipo de Actividad *    │ - Moneda del Objetivo        │
│ - País *                 │ - Info: Alertas Automáticas  │
│ - Email *                │                              │
│ - Teléfono               │ Bloque 3: Datos Bancarios    │
│ - Sitio Web              │ - Banco                      │
│ - Dirección              │ - Número de Cuenta           │
│ - Ciudad, Estado         │ - Código SWIFT               │
│ - Código Postal          │ - Instrucciones de Pago      │
│ - RIF/NIT                │ - Nota al Pie                │
└──────────────────────────┴──────────────────────────────┘
```

**Características UX:**

- ✅ Cards visuales independientes con bordes redondeados
- ✅ Inputs compactos con descripciones cortas
- ✅ Indicador de progreso dinámico
- ✅ Sin formularios largos o técnicos
- ✅ Diseño moderno y minimalista
- ✅ Responsive (columnas en móvil, grid en desktop)

**Cálculo de Progreso:**

```typescript
Identidad: 4 campos requeridos (nombre, tipo, país, email)
Financiero: 3 campos requeridos (base_currency, monthly_income_goal, goal_currency)
Total: 7 campos = 100%
```

**Monedas Soportadas:**

- USD (Dólar)
- EUR (Euro)
- GBP (Libra)
- VES (Bolívar)
- COP (Peso Colombiano)
- MXN (Peso Mexicano)
- ARS (Peso Argentino)

---

## Flujo de Usuario

### 1. Completar Perfil Financiero

```
Usuario → Perfil Empresarial
  ↓
Completa Identidad (nombre, tipo, país, email)
  ↓
Completa Perfil Financiero (moneda, objetivo mensual)
  ↓
Guarda cambios
  ↓
Sistema: Perfil 100% completo
```

### 2. Generación de Alertas

```
Evento: Factura marcada como "Pagada"
  ↓
Backend: generateFinancialGoalAlerts(user_id)
  ↓
Calcula progreso mensual
  ↓
Genera alerta personalizada según:
  - Porcentaje alcanzado
  - Tipo de negocio
  - Moneda configurada
  ↓
Crea registro en tabla `alerts`
  ↓
Frontend: AlertToast muestra notificación
  ↓
Usuario: Ve progreso en tiempo real
```

### 3. Perfil Incompleto

```
Usuario sin objetivo configurado
  ↓
Sistema genera alerta suave (info):
"Completa tu Perfil Financiero para recibir alertas personalizadas"
  ↓
No se generan alertas críticas de objetivo
  ↓
Usuario completa perfil
  ↓
Alertas activas automáticamente
```

---

## Casos de Uso

### Caso 1: Freelancer alcanza 75% de objetivo

```
Perfil:
- business_type: "freelancer"
- monthly_income_goal: 5000
- goal_currency: "USD"

Progreso: $3750 / $5000 = 75%

Alerta Generada:
- Tipo: success
- Toast: Sí
- Título: "Progreso de Facturación: 75%"
- Mensaje: "¡Excelente! Has facturado $3,750.00 de tu objetivo de $5,000.00. ¡Sigue así!"
```

### Caso 2: Empresa supera objetivo

```
Perfil:
- business_type: "empresa"
- monthly_income_goal: 50000
- goal_currency: "USD"

Progreso: $60000 / $50000 = 120%

Alerta Generada:
- Tipo: success
- Toast: Sí
- Título: "¡Meta Superada!"
- Mensaje: "¡Increíble! Has superado tu objetivo en un 20%. Total ingresado: $60,000.00 de $50,000.00."
```

### Caso 3: Agencia fin de mes sin alcanzar objetivo

```
Perfil:
- business_type: "agencia"
- monthly_income_goal: 100000
- goal_currency: "USD"

Fecha: 28 de mes
Progreso: $70000 / $100000 = 70%

Alerta Generada:
- Tipo: warning
- Toast: Sí
- Título: "Objetivo Pendiente (70%)"
- Mensaje: "Quedan pocos días del mes. Has facturado $70,000.00 de $100,000.00. Faltan $30,000.00."
```

---

## Integración con Sistema Existente

### Compatibilidad

- ✅ **No duplica lógica**: Usa `createAlert()` existente
- ✅ **Mismas reglas**: Prioridad, duración, persistencia
- ✅ **Toast + Panel**: Alertas aparecen en ambos lugares
- ✅ **Deduplicación**: Evita alertas duplicadas por evento

### Puntos de Integración

1. **Facturas pagadas**: `invoices.update` → `generateFinancialGoalAlerts()`
2. **Confirmación de pago**: `confirmPayment` → `generateFinancialGoalAlerts()`
3. **Cron diario** (recomendado): Ejecutar a las 9am para alertas de fin de mes

---

## Instalación y Configuración

### 1. Ejecutar Migración SQL

```bash
# En TablePlus o Railway Console:
ALTER TABLE company_profiles 
ADD COLUMN business_type VARCHAR(20) AFTER country,
ADD COLUMN base_currency VARCHAR(3) DEFAULT 'USD' AFTER business_type,
ADD COLUMN monthly_income_goal DECIMAL(10,2) AFTER base_currency,
ADD COLUMN goal_currency VARCHAR(3) DEFAULT 'USD' AFTER monthly_income_goal;

CREATE INDEX idx_company_profiles_business_type ON company_profiles(business_type);
```

### 2. Verificar Deployment

```bash
# Railway despliega automáticamente
# Verificar logs:
- CompanyProfile.tsx cargado
- financial-alerts-service.ts importado
- alert-service.ts actualizado
```

### 3. Probar Flujo

```
1. Ir a Perfil Empresarial
2. Completar campos requeridos:
   - Nombre comercial
   - Tipo de actividad: "Freelancer"
   - País: "Venezuela"
   - Email: tu@email.com
   - Moneda base: "USD"
   - Objetivo mensual: 5000
3. Guardar cambios
4. Crear y marcar factura como pagada
5. Verificar alerta en toast y panel lateral
```

---

## Mantenimiento

### Agregar Nueva Moneda

```typescript
// En CompanyProfile.tsx:
const currencies = [
  ...
  { code: 'BRL', name: 'Real Brasileño (BRL)', symbol: 'R$' },
];

// En financial-alerts-service.ts:
const symbols: { [key: string]: string } = {
  ...
  BRL: 'R$',
};
```

### Ajustar Umbrales de Alertas

```typescript
// En financial-alerts-service.ts:
// Cambiar porcentajes de milestone:
if (progress.percentage >= 50 && progress.percentage < 75) { ... }
if (progress.percentage >= 75 && progress.percentage < 100) { ... }
```

### Personalizar Copy por Idioma

```typescript
// Agregar traducciones en getPersonalizedCopy():
const copies = {
  freelancer: {
    es: { title: 'Progreso de Facturación', verb: 'facturado' },
    en: { title: 'Billing Progress', verb: 'billed' },
  },
};
```

---

## Métricas y Monitoreo

### KPIs del Sistema

- **Tasa de Completitud de Perfil**: % usuarios con perfil financiero completo
- **Alertas Generadas**: Cantidad por tipo (50%, 75%, 100%, 110%, fin de mes)
- **Engagement**: % usuarios que completan perfil tras alerta suave
- **Precisión**: % alertas que coinciden con progreso real

### Logs Recomendados

```typescript
console.log('[FinancialAlerts] Generated alert:', {
  userId,
  progress: progress.percentage,
  alertType: alert.type,
  businessType: profile.business_type,
});
```

---

## Roadmap Futuro

### Fase 2: Alertas Avanzadas
- Predicción de alcance de objetivo (ML)
- Alertas de tendencia (semanal)
- Comparación con meses anteriores

### Fase 3: Gamificación
- Badges por logros (3 meses consecutivos alcanzados)
- Racha de objetivos cumplidos
- Leaderboard (opcional, privado)

### Fase 4: Integraciones
- Sincronización con contabilidad
- Exportación de reportes personalizados
- API pública para terceros

---

## Soporte y Troubleshooting

### Problema: Alertas no aparecen

**Diagnóstico:**
1. Verificar perfil completo: `SELECT * FROM company_profiles WHERE user_id = X`
2. Verificar facturas pagadas: `SELECT * FROM invoices WHERE user_id = X AND status = 'paid'`
3. Verificar alertas generadas: `SELECT * FROM alerts WHERE user_id = X ORDER BY created_at DESC`

**Solución:**
- Si perfil incompleto: Completar campos requeridos
- Si no hay facturas pagadas: Marcar al menos una como pagada
- Si alertas no se crean: Verificar logs de `generateFinancialGoalAlerts()`

### Problema: Progreso incorrecto

**Diagnóstico:**
```sql
SELECT 
  SUM(total) as monthly_income,
  COUNT(*) as invoice_count
FROM invoices 
WHERE user_id = X 
  AND status = 'paid'
  AND updated_at >= DATE_FORMAT(NOW(), '%Y-%m-01');
```

**Solución:**
- Verificar que `updated_at` se actualiza al marcar como pagada
- Verificar que `status = 'paid'` (no `payment_sent` u otro)

---

## Conclusión

El sistema de Perfil Financiero convierte la configuración estática en un motor activo de personalización que:

✅ **Reduce fricción**: Completar perfil una vez, alertas automáticas para siempre  
✅ **Aumenta engagement**: Usuarios ven progreso en tiempo real  
✅ **Mejora retención**: Alertas personalizadas crean hábito de uso  
✅ **Escalable**: Fácil agregar nuevos tipos de alertas y métricas  
✅ **Profesional**: UX clara, copy personalizado, diseño moderno  

---

**Versión:** 1.0  
**Fecha:** Enero 2026  
**Autor:** Manus AI  
**Repositorio:** georgemontilva-crypto/WorkFlow
