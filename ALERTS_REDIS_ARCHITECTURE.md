# Arquitectura del Sistema de Alertas con Redis

## Visión General

El sistema de alertas de Finwrk utiliza una arquitectura híbrida donde:
- **Base de datos**: Es la única fuente de verdad para almacenamiento permanente
- **Redis**: Actúa como capa de rendimiento para evaluación y prevención de duplicados

## Componentes Principales

### 1. Base de Datos (Fuente de Verdad)

**Tabla: `alerts`**
- Almacena todas las alertas disparadas
- Mantiene el historial completo
- Estados: leída/no leída
- Referencias a facturas, activos, usuarios

**Tabla: `price_alerts`**
- Almacena configuración de alertas de precio
- Estado activo/inactivo
- Última vez disparada

### 2. Redis (Capa de Rendimiento)

**Propósito:**
- Evaluación rápida de condiciones
- Prevención de disparos duplicados
- Manejo de estados temporales
- Cola de eventos
- Rate limiting

**Claves Utilizadas:**

```
alerts:active:{type}:{id}          - Alertas activas cargadas desde DB
alerts:triggered:{alertId}         - Marca alertas ya disparadas (TTL: 24h)
alerts:processing:{alertId}        - Lock para prevenir race conditions (TTL: 5min)
alerts:ratelimit:toast:{userId}    - Límite de toasts (5 por minuto)
alerts:ratelimit:email:{userId}:{type} - Límite de emails (3 por hora)
alerts:events:queue                - Cola de eventos para procesamiento
```

## Flujo de Alertas

### Fase 1: Evaluación (Price Alerts Worker)

```
1. Worker se ejecuta cada minuto (cron job)
2. Carga alertas activas desde DB
3. Transforma a formato AlertCondition
4. Carga a Redis para evaluación rápida
5. Obtiene precios actuales de APIs externas
6. Evalúa cada alerta:
   - Verifica en Redis si ya fue disparada
   - Compara precio actual vs objetivo
   - Si se cumple condición → Encola evento
7. Desactiva alerta en DB
8. Remueve de Redis active alerts
```

### Fase 2: Procesamiento (Alerts Processor Worker)

```
1. Worker escucha cola de eventos en Redis (blocking pop)
2. Recibe evento de alerta
3. Verifica en Redis:
   - ¿Ya fue disparada? → Skip
   - ¿Está siendo procesada? → Skip
4. Adquiere lock en Redis (atomic)
5. Persiste alerta en DB
6. Verifica rate limit de email
7. Envía email si aplica
8. Marca como disparada en Redis
9. Libera lock
```

## Prevención de Duplicados

### Mecanismo 1: Triggered Flag
```typescript
// Marca alerta como disparada por 24 horas
await alertsRedisService.markAlertTriggered(alertId);

// Verifica antes de procesar
if (await alertsRedisService.isAlertTriggered(alertId)) {
  return; // Skip
}
```

### Mecanismo 2: Processing Lock
```typescript
// Intenta adquirir lock (atomic SET NX)
const locked = await alertsRedisService.lockAlertForProcessing(alertId);
if (!locked) {
  return; // Otro worker está procesando
}

try {
  // Procesar...
} finally {
  await alertsRedisService.unlockAlert(alertId);
}
```

## Rate Limiting

### Toast Notifications
- **Límite**: 5 toasts por minuto por usuario
- **Propósito**: Evitar spam visual en la UI
- **Prioridad**: Critical > Warning > Info

```typescript
const canShow = await alertsRedisService.checkToastRateLimit(userId);
if (canShow) {
  // Mostrar toast
  await alertsRedisService.incrementToastRateLimit(userId);
}
```

### Email Notifications
- **Límite**: 3 emails por hora por tipo de alerta por usuario
- **Propósito**: Evitar sobrecarga de inbox
- **Implementación**: Contador con TTL de 1 hora

```typescript
const canSend = await alertsRedisService.checkEmailRateLimit(userId, alertType);
if (canSend) {
  // Enviar email
  await alertsRedisService.incrementEmailRateLimit(userId, alertType);
}
```

## Tipos de Alertas Soportadas

### 1. Price Alerts
- **Trigger**: Precio cruza umbral configurado
- **Evaluación**: Cada minuto
- **Fuente**: CoinGecko API (crypto), Alpha Vantage (stocks)

### 2. Overdue Invoices (Futuro)
- **Trigger**: Factura vence sin pago
- **Evaluación**: Diaria
- **Fuente**: Base de datos

### 3. Pending Payments (Futuro)
- **Trigger**: Pago pendiente de confirmación
- **Evaluación**: Cada hora
- **Fuente**: Base de datos

### 4. Month End Events (Futuro)
- **Trigger**: Fin de mes, cierre contable
- **Evaluación**: Diaria
- **Fuente**: Calendario

## Ventajas de esta Arquitectura

### ✅ Rendimiento
- Evaluación rápida en Redis sin consultas pesadas a DB
- Prevención de race conditions con locks atómicos
- Rate limiting eficiente

### ✅ Confiabilidad
- DB como fuente de verdad garantiza persistencia
- Sistema de cola asegura procesamiento eventual
- Locks previenen duplicados

### ✅ Escalabilidad
- Workers pueden escalar horizontalmente
- Redis maneja alta concurrencia
- Separación de evaluación y procesamiento

### ✅ Mantenibilidad
- Código modular y separado por responsabilidad
- Fácil agregar nuevos tipos de alertas
- Logs detallados para debugging

## Monitoreo y Debugging

### Estadísticas en Redis
```typescript
const stats = await alertsRedisService.getStats();
// {
//   activeAlerts: 150,
//   triggeredAlerts: 45,
//   processingAlerts: 2,
//   queueLength: 8
// }
```

### Health Check
```typescript
const healthy = await alertsRedisService.healthCheck();
if (!healthy) {
  // Redis no disponible, pausar workers
}
```

### Logs Clave
```
[Price Alerts] Starting price alerts check...
[Price Alerts] Found 150 active alerts in DB
[Price Alerts] Alert triggered for BTC: 65000 above 64000
[Alerts Redis] Enqueued event: price_alert for user 123
[Alerts Processor] Processing event: price_alert for user 123
[Alerts Processor] Alert persisted to database for user 123
[Alerts Processor] Email sent to user@example.com
```

## Configuración Requerida

### Variables de Entorno
```bash
# Redis (Railway)
REDIS_URL=redis://default:password@host:port

# APIs Externas
ALPHA_VANTAGE_API_KEY=your_key_here

# App
APP_URL=https://finwrk.app
```

### Dependencias
```json
{
  "ioredis": "^5.3.2",
  "bull": "^4.12.0"
}
```

## Mejoras Futuras

1. **Dashboard de Alertas**
   - Visualizar estadísticas en tiempo real
   - Gráficos de alertas disparadas
   - Monitoreo de rate limits

2. **Alertas Personalizadas**
   - Permitir usuarios crear alertas custom
   - Webhooks para integraciones externas

3. **Machine Learning**
   - Predicción de alertas importantes
   - Optimización de rate limits por usuario

4. **Multi-tenancy**
   - Aislamiento por organización
   - Límites por plan (Free/Pro)

## Troubleshooting

### Problema: Alertas duplicadas
**Solución**: Verificar que Redis esté funcionando correctamente
```bash
redis-cli PING
```

### Problema: Alertas no se disparan
**Solución**: Verificar logs de workers
```bash
# Railway logs
railway logs --service your-service
```

### Problema: Rate limit muy agresivo
**Solución**: Ajustar constantes en `alertsRedisService.ts`
```typescript
private readonly TTL_RATE_LIMIT = 60; // Cambiar a 120 para 2 minutos
```

## Conclusión

Esta arquitectura híbrida combina lo mejor de ambos mundos:
- **Persistencia confiable** en base de datos
- **Rendimiento óptimo** con Redis
- **Prevención de duplicados** garantizada
- **Escalabilidad** para crecimiento futuro

El sistema está diseñado para ser robusto, mantenible y fácil de extender con nuevos tipos de alertas.
