# Sistema de Alertas de Precio de Criptomonedas

## Descripción General

Sistema completo de alertas de precio que permite a los usuarios configurar notificaciones automáticas cuando una criptomoneda alcanza un precio específico. Las alertas se disparan automáticamente y notifican por email y dentro de la aplicación.

## Características

### ✅ Funcionalidades Implementadas

1. **Configuración de Alertas**
   - Precio objetivo personalizable
   - Condiciones: mayor o igual / menor o igual
   - Opciones de notificación: email y/o app
   - Múltiples alertas por criptomoneda

2. **Monitoreo Automático**
   - Verificación cada 10 segundos (sincronizado con actualización de precios)
   - Comparación automática de precios actuales vs objetivos
   - Disparador instantáneo cuando se cumple la condición

3. **Notificaciones**
   - **Email**: Plantilla profesional con detalles completos
   - **App**: Notificación emergente en el panel lateral
   - Ambas notificaciones incluyen:
     - Símbolo de la criptomoneda
     - Precio objetivo
     - Precio actual alcanzado
     - Fecha y hora del evento

4. **Gestión de Alertas**
   - Ver alertas activas
   - Historial de alertas disparadas
   - Eliminar alertas
   - Desactivación automática después de dispararse

5. **UI/UX**
   - Botón de campana 🔔 en cada criptomoneda del listado
   - Modal elegante con diseño Apple Wallet-inspired
   - Estética FinWrk: fondo oscuro, accent verde lima (#C4FF3D)
   - Responsive y mobile-first

## Arquitectura Técnica

### Base de Datos

**Tabla**: `price_alerts`

```sql
CREATE TABLE price_alerts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  symbol VARCHAR(20) NOT NULL,
  type ENUM('crypto', 'stock', 'forex', 'commodity') NOT NULL,
  target_price DECIMAL(20, 8) NOT NULL,
  condition ENUM('above', 'below') NOT NULL,
  is_active INT NOT NULL DEFAULT 1,
  notify_email INT NOT NULL DEFAULT 1,
  notify_app INT NOT NULL DEFAULT 1,
  triggered_at TIMESTAMP NULL,
  last_triggered_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### Backend

**Archivos principales:**

1. **`server/db-price-alerts.ts`**
   - Funciones CRUD para alertas
   - `createPriceAlert()` - Crear nueva alerta
   - `getUserPriceAlerts()` - Obtener todas las alertas del usuario
   - `getActivePriceAlerts()` - Obtener alertas activas
   - `getAllActivePriceAlerts()` - Obtener todas las alertas activas (para monitoreo)
   - `triggerPriceAlert()` - Marcar alerta como disparada
   - `deletePriceAlert()` - Eliminar alerta

2. **`server/routers_price_alerts.ts`**
   - Router tRPC con procedimientos protegidos
   - `list` - Listar alertas del usuario
   - `listActive` - Listar alertas activas
   - `getBySymbol` - Obtener alertas por símbolo
   - `create` - Crear nueva alerta (con validaciones)
   - `toggleStatus` - Activar/desactivar alerta
   - `delete` - Eliminar alerta
   - `countActive` - Contar alertas activas
   - `checkAlerts` - Verificar alertas (llamado por frontend)

3. **`server/services/priceAlertsMonitor.ts`**
   - Servicio de monitoreo y disparador
   - `checkPriceAlerts()` - Verifica todas las alertas activas
   - `triggerAlert()` - Dispara notificaciones
   - `getPriceAlertEmailTemplate()` - Plantilla de email

### Frontend

**Archivos principales:**

1. **`client/src/components/PriceAlertModal.tsx`**
   - Modal de configuración de alertas
   - Formulario de creación
   - Lista de alertas activas
   - Historial de alertas disparadas

2. **`client/src/pages/Markets.tsx`**
   - Botón de campana en cada crypto
   - Integración con modal de alertas
   - Llamada a `checkAlerts` cada 10 segundos

## Flujo de Funcionamiento

### 1. Crear Alerta

```
Usuario → Click en campana 🔔 → Modal se abre
       → Ingresa precio objetivo
       → Selecciona condición (above/below)
       → Elige notificaciones (email/app)
       → Click "Crear Alerta"
       → Validación backend
       → Alerta guardada en BD
```

### 2. Monitoreo Automático

```
Cada 10 segundos:
  Frontend → Fetch precios de CoinGecko
          → Actualiza estado local
          → Llama a checkAlerts(prices)
          
Backend → Recibe precios actuales
        → Obtiene todas las alertas activas
        → Compara cada alerta con precio actual
        → Si condición se cumple:
            → Marca alerta como disparada
            → Envía email
            → Crea notificación en app
```

### 3. Notificación

```
Alerta disparada:
  1. BD: is_active = 0, triggered_at = NOW()
  2. Email enviado con plantilla profesional
  3. Notificación creada en panel lateral
  4. Usuario recibe ambas notificaciones
```

## Validaciones y Seguridad

### Backend

- ✅ Precio objetivo debe ser mayor a 0
- ✅ No permite alertas duplicadas (mismo símbolo, condición y precio)
- ✅ Solo el dueño puede ver/editar/eliminar sus alertas
- ✅ Validación de tipos con Zod
- ✅ Procedimientos protegidos con `protectedProcedure`

### Frontend

- ✅ Validación de campos antes de enviar
- ✅ Feedback inmediato con toasts
- ✅ Confirmación antes de eliminar
- ✅ Manejo de errores con mensajes claros

## Plantilla de Email

La plantilla de email incluye:

- 🎨 Diseño oscuro consistente con FinWrk
- 📊 Tabla con detalles de la alerta
- 🔔 Emoji indicador (🚀 para above, 📉 para below)
- 🔗 Botón CTA para ir a Mercados
- 📱 Responsive para móviles

## Optimizaciones

### Performance

1. **Verificación eficiente**
   - Solo se verifican alertas activas
   - Mapa de precios para lookup O(1)
   - No bloquea la UI (mutación en background)

2. **Base de datos**
   - Índices en `user_id` y `is_active`
   - Consultas optimizadas con Drizzle ORM

3. **Frontend**
   - Lazy loading del modal
   - Invalidación selectiva de queries
   - Estado local para UI instantánea

### Escalabilidad

- Preparado para soportar miles de alertas
- Monitoreo distribuido (puede moverse a worker)
- Rate limiting en endpoints sensibles

## Uso

### Para Usuarios

1. Ve a la página de Mercados
2. Click en el ícono de campana 🔔 junto a cualquier criptomoneda
3. Configura tu alerta:
   - Ingresa el precio objetivo
   - Selecciona si quieres ser notificado cuando el precio esté por encima o por debajo
   - Elige cómo quieres ser notificado (email, app, o ambos)
4. Click en "Crear Alerta"
5. ¡Listo! Serás notificado automáticamente cuando se cumpla la condición

### Para Desarrolladores

#### Crear una alerta programáticamente

```typescript
const alert = await trpc.priceAlerts.create.mutate({
  symbol: 'BTC',
  type: 'crypto',
  target_price: '50000',
  condition: 'above',
  notify_email: true,
  notify_app: true,
});
```

#### Obtener alertas de un usuario

```typescript
const alerts = await trpc.priceAlerts.list.useQuery();
```

#### Verificar alertas manualmente

```typescript
const prices = [
  { symbol: 'BTC', price: 50000 },
  { symbol: 'ETH', price: 3000 },
];

await trpc.priceAlerts.checkAlerts.mutate({ prices });
```

## Mejoras Futuras (Opcional)

### Funcionalidades Bonus

1. **Alertas por porcentaje**
   - "Notificarme cuando BTC suba 10%"
   - "Notificarme cuando ETH baje 5%"

2. **Alertas inteligentes con IA**
   - "BTC subió 12% desde tu última compra"
   - "Buen momento para comprar según tendencias"

3. **Alertas recurrentes**
   - Reactivar automáticamente después de dispararse
   - Alertas diarias/semanales

4. **Alertas combinadas**
   - Múltiples condiciones
   - Alertas basadas en volumen o market cap

5. **Integración con compras**
   - Alertas basadas en precio de compra
   - Notificaciones de ROI

## Soporte

Para reportar bugs o solicitar funcionalidades:
- GitHub Issues: [georgemontilva-crypto/WorkFlow](https://github.com/georgemontilva-crypto/WorkFlow)
- Email: soporte@finwrk.app

---

**Versión**: 1.0.0  
**Fecha**: Febrero 2026  
**Autor**: FinWrk Team
