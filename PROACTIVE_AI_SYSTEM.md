# Sistema de Mensajes Proactivos de IA - Finwrk

## Visión General

El sistema de mensajes proactivos extiende el sistema de alertas inteligentes, incorporando análisis contextual generado exclusivamente por IA basado en datos financieros reales del usuario.

> **Principio Fundamental:** La IA solo genera mensajes cuando hay insights relevantes. El silencio es un resultado válido y deseado.

## Rol de la IA

### Lo que hace la IA:
- **Analista silencioso**: Observa datos financieros con criterio
- **Detector de patrones**: Identifica cambios, riesgos y oportunidades
- **Generador de insights**: Comunica solo cuando aporta valor real

### Lo que NO hace la IA:
- ❌ Generar mensajes por calendario fijo
- ❌ Crear alertas vacías o motivacionales genéricas
- ❌ Interrumpir con toasts emergentes
- ❌ Ejecutar acciones automáticas

## Cuándo se Genera un Mensaje

La IA genera un mensaje proactivo **únicamente si**:

1. ✅ Existen datos suficientes para analizar
2. ✅ Se detecta un patrón, riesgo, mejora o insight relevante
3. ✅ El mensaje aporta valor real al usuario
4. ✅ No se ha generado un mensaje similar recientemente

**Si no hay nada relevante que comunicar, NO se genera ningún mensaje.**

## Datos Analizados

La IA analiza de forma resumida y contextual:

| Categoría | Datos |
|-----------|-------|
| **Perfil** | Tipo de negocio, moneda base, meta de ingresos |
| **Ingresos** | Mes actual vs anterior, promedios 3 y 6 meses |
| **Facturas** | Pendientes, vencidas, pagadas este mes |
| **Clientes** | Total, activos, concentración de ingresos |
| **Pagos** | Promedio días de pago, tasa de pagos tardíos |
| **Actividad** | Días desde última factura/pago |
| **Alertas** | Sin resolver, resueltas este mes |

## Tipos de Insights

### Insights a Detectar:
- **Cambios significativos**: Mejoras o empeoramientos en ingresos
- **Riesgos reales**: Dependencia de un cliente, caída de ingresos
- **Patrones repetidos**: Comportamiento de pago de clientes
- **Logros**: Metas alcanzadas, mejora en tiempos de cobro
- **Oportunidades**: Momentos para diversificar o invertir

### Insights a Evitar:
- "Todo va bien, sigue así" (vacío)
- Recordatorios genéricos
- Mensajes sin información nueva
- Predicciones sin base en datos

## Personalización por Tipo de Negocio

### Freelancer
- **Enfoque**: Impacto inmediato, liquidez, clientes clave
- **Lenguaje**: Directo y personal
- **Prioridad**: Flujo de caja y estabilidad

### Agencia
- **Enfoque**: Orden, volumen, eficiencia operativa
- **Lenguaje**: Organizacional
- **Prioridad**: Gestión de múltiples clientes

### Empresa
- **Enfoque**: Tendencias, estabilidad, riesgo futuro
- **Lenguaje**: Formal y analítico
- **Prioridad**: Análisis detallados

## Estructura del Mensaje

Todo mensaje proactivo incluye:

```typescript
interface ProactiveInsight {
  type: 'positive' | 'warning' | 'neutral' | 'opportunity';
  category: 'income' | 'clients' | 'payments' | 'activity' | 'goals' | 'risk';
  title: string;      // Título breve
  message: string;    // Insight principal
  context?: string;   // Comparación o contexto
  suggestion?: string; // Sugerencia suave (no acción automática)
  confidence: number; // 0.0 - 1.0
  priority: 'high' | 'medium' | 'low';
  emailWorthy: boolean;
}
```

### Ejemplo de Mensaje:

> **Análisis de Ingresos**
> 
> Tus ingresos se han mantenido estables durante los últimos 3 meses. No se detectan riesgos inmediatos.
> 
> *Contexto: Promedio mensual de $4,500 con variación menor al 5%*
> 
> *Sugerencia: Buen momento para mantener el enfoque actual.*

## Canales y Visibilidad

### Dónde se muestran:
- ✅ Panel lateral de alertas (AlertCenter)
- ✅ Dashboard como bloque informativo (opcional)

### Dónde NO se muestran:
- ❌ Toast emergente (no interrumpe)
- ❌ Notificaciones push

### Email:
- Solo para mensajes de alto valor (`emailWorthy: true`)
- Ejemplos: cierre de mes, logro de meta, riesgo crítico
- Nunca para mensajes triviales

## Control de Repetición

### Rate Limiting:
- Máximo 3 análisis proactivos por día por usuario
- Cache de 24 horas si los datos no cambian

### Prevención de Ruido:
- No repetir mensajes sin cambios reales en los datos
- No generar mensajes similares consecutivos
- Cache de 7 días por categoría de insight

## Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                    Proactive AI Job                          │
│  (Ejecuta cada 6 horas para usuarios activos)               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                 proactiveAIService.ts                        │
│  - Recolecta datos financieros del usuario                  │
│  - Verifica si hay cambios (hash de datos)                  │
│  - Verifica rate limits                                      │
│  - Llama a OpenAI solo si hay cambios                       │
│  - Valida que el insight sea relevante                      │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
┌─────────────────────────┐    ┌─────────────────────────┐
│         Redis           │    │        OpenAI API       │
│  - Hash de datos        │    │  - gpt-4.1-mini         │
│  - Rate limiting        │    │  - JSON response        │
│  - Cache de insights    │    │  - Prompts adaptados    │
└─────────────────────────┘    └─────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Base de Datos                             │
│  - Tabla alerts con event = 'proactive_*'                   │
│  - shown_as_toast = 0 (no interrumpe)                       │
│  - persistent = 1 (visible en AlertCenter)                  │
└─────────────────────────────────────────────────────────────┘
```

## Eventos de Alerta

Los mensajes proactivos se guardan con estos eventos:

| Evento | Descripción |
|--------|-------------|
| `proactive_income` | Análisis de ingresos |
| `proactive_clients` | Análisis de clientes |
| `proactive_payments` | Análisis de pagos |
| `proactive_activity` | Análisis de actividad |
| `proactive_goals` | Progreso de metas |
| `proactive_risk` | Análisis de riesgo |

## Integración con Sistema Existente

Los mensajes proactivos:
- ✅ Se integran con el centro de alertas
- ✅ Tienen estado (new / seen / resolved)
- ✅ No interfieren con alertas CRITICAL o WARNING
- ✅ Se muestran con tipo `info` (azul)
- ✅ No generan toasts emergentes

## Objetivo Final

El sistema debe lograr que el usuario sienta que:

1. **El sistema lo observa con criterio** - No genera ruido innecesario
2. **Solo le habla cuando vale la pena** - Cada mensaje tiene valor
3. **La IA entiende su negocio** - Mensajes personalizados
4. **Finwrk aporta valor incluso cuando todo va bien** - Confirma estabilidad

> El sistema se comporta como un **analista silencioso**, no como un generador de mensajes.

## Archivos del Sistema

| Archivo | Descripción |
|---------|-------------|
| `server/services/proactiveAIService.ts` | Servicio principal de análisis |
| `server/_core/proactive-ai-job.ts` | Job programado cada 6 horas |
| `server/index.ts` | Inicialización del scheduler |
| `client/src/components/AlertCenter.tsx` | Muestra insights en panel |
| `client/src/pages/Home.tsx` | Muestra insights en dashboard |
