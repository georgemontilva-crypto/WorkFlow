# Sistema de IA para Alertas - Finwrk

## Visión General

El sistema de IA para alertas extiende el sistema de alertas inteligentes existente, incorporando una capa de análisis contextual que ayuda a interpretar, priorizar y resolver las notificaciones generadas por reglas determinísticas.

> **Importante**: La IA NO reemplaza las reglas existentes. Las reglas determinísticas siguen siendo la única fuente para disparar alertas.

## Rol de la IA

### Lo que hace la IA:
- **Analista contextual**: Explica qué está pasando y por qué es relevante
- **Asistente de decisión**: Evalúa impacto financiero, operativo y urgencia
- **Generador de sugerencias**: Proporciona acciones recomendadas con alternativas

### Lo que NO hace la IA:
- ❌ Generar nuevas alertas por su cuenta
- ❌ Modificar estados financieros automáticamente
- ❌ Ejecutar acciones sin confirmación del usuario
- ❌ Reemplazar las reglas existentes

## Cuándo se Ejecuta la IA

La IA se ejecuta **solo** en los siguientes escenarios:

1. ✅ Cuando el usuario abre una alerta de tipo **CRITICAL** o **WARNING**
2. ✅ Cuando el usuario hace clic en "¿Por qué veo esta alerta?"
3. ✅ Cuando el usuario solicita explícitamente ayuda o explicación

**NO se ejecuta:**
- ❌ En background continuo
- ❌ Para alertas INFO
- ❌ Para eventos triviales

## Arquitectura

### Componentes

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (React)                        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  AlertCenter.tsx                                      │   │
│  │    └── AlertAIAnalysis.tsx                           │   │
│  │          - Botón "¿Por qué veo esta alerta?"         │   │
│  │          - Muestra análisis expandible               │   │
│  │          - Acciones sugeridas                        │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Backend (Node.js)                       │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  routers.ts                                           │   │
│  │    - alerts.analyzeWithAI                            │   │
│  │    - alerts.aiStats                                  │   │
│  │    - alerts.markAIAnalysisUsed                       │   │
│  └─────────────────────────────────────────────────────┘   │
│                              │                               │
│                              ▼                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  services/alertAIService.ts                          │   │
│  │    - Construye contexto estructurado                 │   │
│  │    - Llama a OpenAI API                              │   │
│  │    - Maneja cache y rate limiting                    │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
┌─────────────────────────┐    ┌─────────────────────────┐
│         Redis           │    │        OpenAI API       │
│  - Cache de análisis    │    │  - gpt-4.1-mini         │
│  - Rate limiting        │    │  - JSON response        │
│  - Métricas de uso      │    │  - Prompts adaptados    │
└─────────────────────────┘    └─────────────────────────┘
```

### Flujo de Datos

```
1. Usuario abre AlertCenter
2. Ve alerta CRITICAL o WARNING
3. Hace clic en "¿Por qué veo esta alerta?"
4. Frontend llama a alerts.analyzeWithAI
5. Backend:
   a. Verifica rate limit
   b. Busca en cache
   c. Si no hay cache:
      - Construye contexto (alerta, factura, cliente, finanzas)
      - Llama a OpenAI con prompt personalizado
      - Cachea resultado
6. Devuelve análisis estructurado
7. Frontend muestra:
   - Explicación
   - Evaluación de impacto
   - Recomendación
   - Acciones sugeridas
```

## Contexto Estructurado

La IA recibe un contexto filtrado y estructurado:

```typescript
interface AlertContext {
  // Información de la alerta
  alertId: number;
  alertType: 'warning' | 'critical';
  event: string;
  message: string;
  
  // Perfil del usuario
  businessType: 'freelancer' | 'empresa' | 'agencia';
  baseCurrency: string;
  monthlyIncomeGoal?: number;
  
  // Datos relacionados (si aplica)
  invoiceData?: {
    clientName: string;
    total: number;
    dueDate: string;
    status: string;
    daysOverdue?: number;
  };
  
  clientHistory?: {
    totalInvoices: number;
    paidInvoices: number;
    averagePaymentDays: number;
    latePayments: number;
    totalRevenue: number;
  };
  
  financialContext?: {
    monthlyIncome: number;
    monthlyGoal: number;
    percentageOfGoal: number;
    trend: 'up' | 'down' | 'stable';
  };
  
  similarAlerts?: {
    count: number;
    lastOccurrence: string;
    resolved: number;
  };
}
```

## Respuesta de la IA

```typescript
interface AIAnalysisResult {
  // Explicación
  explanation: string;
  relevance: string;
  
  // Evaluación de impacto
  impact: {
    financial: 'alto' | 'medio' | 'bajo' | 'ninguno';
    operational: 'alto' | 'medio' | 'bajo' | 'ninguno';
    urgency: 'inmediata' | 'alta' | 'media' | 'baja';
  };
  
  // Recomendación
  recommendation: {
    action: string;
    alternative?: string;
    consequence: string;
  };
  
  // Acciones rápidas
  suggestedActions: Array<{
    label: string;
    action: string;
    type: 'primary' | 'secondary';
  }>;
  
  // Metadata
  confidence: number;
  processingTime: number;
  cached: boolean;
}
```

## Personalización por Tipo de Negocio

### Freelancer
- Enfatiza impacto inmediato y flujo de caja personal
- Lenguaje directo y personal
- Considera que cada factura puede ser un % significativo del ingreso

### Agencia
- Enfatiza orden, volumen y eficiencia operativa
- Lenguaje organizacional
- Considera la gestión de múltiples clientes

### Empresa
- Enfatiza tendencias, estabilidad y gestión de riesgo
- Lenguaje formal y analítico
- Proporciona análisis más detallados

## Control de Costos

### Rate Limiting
- **Máximo**: 20 análisis por hora por usuario
- **Implementación**: Contador en Redis con TTL de 1 hora
- **Clave**: `ai:ratelimit:{userId}`

### Cache
- **TTL**: 1 hora
- **Clave**: `ai:analysis:{alertId}:{contextHash}`
- **Invalidación**: Cuando cambia el contexto de la alerta

### Métricas
- **Uso de análisis**: `ai:metrics:used:{alertId}`
- **Retención**: 30 días

## Integración con UX

### Ubicación
- Dentro de cada alerta en el AlertCenter
- Botón "¿Por qué veo esta alerta?" (estilo outline, dashed border)
- Panel expandible con análisis completo

### Diseño
- Consistente con el tema oscuro de la plataforma
- Colores según tipo de alerta (rojo para critical, amarillo para warning)
- Indicadores visuales de impacto y urgencia
- Botones de acción claros

### Comportamiento
- No se ejecuta automáticamente
- Requiere acción explícita del usuario
- Muestra estado de carga
- Indica si el resultado viene de cache
- Muestra análisis restantes por hora

## Endpoints API

### `alerts.analyzeWithAI`
```typescript
// Input
{ alertId: number }

// Output
AIAnalysisResult
```

### `alerts.aiStats`
```typescript
// Output
{
  callsThisHour: number;
  remainingCalls: number;
}
```

### `alerts.markAIAnalysisUsed`
```typescript
// Input
{
  alertId: number;
  actionTaken: string;
}

// Output
{ success: boolean }
```

## Configuración

### Variables de Entorno
```bash
# OpenAI (ya configurado en el proyecto)
OPENAI_API_KEY=your_key_here

# Redis (ya configurado)
REDIS_URL=redis://default:password@host:port
```

### Modelo de IA
- **Modelo**: gpt-4.1-mini
- **Temperatura**: 0.3 (respuestas consistentes)
- **Max tokens**: 800
- **Formato**: JSON

## Ejemplo de Uso

### Alerta: Factura Vencida

**Contexto enviado:**
```json
{
  "alertType": "critical",
  "event": "invoice_overdue",
  "message": "Factura #1234 venció hace 5 días",
  "businessType": "freelancer",
  "invoiceData": {
    "clientName": "Acme Corp",
    "total": 2500,
    "daysOverdue": 5
  },
  "clientHistory": {
    "totalInvoices": 8,
    "paidInvoices": 7,
    "averagePaymentDays": 12,
    "latePayments": 2
  },
  "financialContext": {
    "monthlyIncome": 4000,
    "monthlyGoal": 6000,
    "percentageOfGoal": 67
  }
}
```

**Respuesta de IA:**
```json
{
  "explanation": "Esta factura representa el 62% de tu ingreso mensual actual y está 5 días vencida. Acme Corp tiene un historial de pago generalmente bueno (87% de facturas pagadas), aunque con 2 pagos tardíos previos.",
  "relevance": "Este monto es significativo para tu flujo de caja y necesitas cobrar para alcanzar tu meta mensual.",
  "impact": {
    "financial": "alto",
    "operational": "medio",
    "urgency": "alta"
  },
  "recommendation": {
    "action": "Envía un recordatorio de pago hoy. El cliente suele pagar, solo necesita un empujón.",
    "alternative": "Si no responde en 48 horas, considera una llamada telefónica.",
    "consequence": "Sin este pago, tu ingreso mensual quedará en 67% de tu meta."
  },
  "suggestedActions": [
    { "label": "Enviar recordatorio", "action": "send_reminder", "type": "primary" },
    { "label": "Ver factura", "action": "view_invoice", "type": "secondary" }
  ],
  "confidence": 0.85
}
```

## Evolución del Sistema

El objetivo es evolucionar de:

> "Notificaciones que informan"

a:

> "Notificaciones que ayudan a decidir y resolver"

La IA potencia el sistema existente sin añadir complejidad innecesaria, manteniendo una experiencia clara, confiable y profesional.
