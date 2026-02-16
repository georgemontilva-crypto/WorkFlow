# Sistema de Chat de Soporte en Tiempo Real

## 📋 Resumen

Sistema completo de soporte en tiempo real tipo Crisp/Intercom implementado con WebSockets, Redis, bot automático y panel de administración para agentes.

## 🏗 Arquitectura

### Backend
- **WebSockets**: Socket.IO para comunicación en tiempo real
- **Redis**: Pub/sub para escalabilidad horizontal
- **Base de datos**: MySQL con tablas optimizadas
- **tRPC**: Endpoints REST para operaciones CRUD

### Frontend
- **Widget flotante**: Botón circular con hover animado
- **Chat en tiempo real**: Conexión WebSocket persistente
- **Panel admin**: Vista dividida para agentes
- **Notificaciones**: Badges rojos con contadores

## 📊 Base de Datos

### Tabla: `support_conversations`
```sql
- id: BIGINT UNSIGNED (PK)
- user_id: BIGINT UNSIGNED (FK → users)
- status: ENUM('bot', 'waiting_agent', 'active', 'closed')
- assigned_agent_id: BIGINT UNSIGNED (FK → users, nullable)
- created_at, updated_at, last_message_at: TIMESTAMP
```

### Tabla: `support_messages`
```sql
- id: BIGINT UNSIGNED (PK)
- conversation_id: BIGINT UNSIGNED (FK → support_conversations)
- sender_type: ENUM('user', 'bot', 'agent')
- sender_id: BIGINT UNSIGNED (FK → users, nullable para bot)
- message: TEXT
- read_by_user, read_by_agent: BOOLEAN
- created_at: TIMESTAMP
```

## 🔄 Flujo de Funcionamiento

### 1. Usuario abre el chat
1. Se crea conversación con `status = 'bot'`
2. Bot envía mensaje de bienvenida automático
3. Se muestran opciones rápidas:
   - 💳 Facturación
   - 💰 Pagos
   - 🔧 Problemas técnicos
   - 💬 Otro

### 2. Escalamiento a agente
- Usuario selecciona "Hablar con un agente humano"
- Status cambia a `waiting_agent`
- Aparece en cola del panel admin
- Badge rojo notifica a agentes

### 3. Agente toma conversación
- Agente hace clic en "Tomar Conversación"
- Status cambia a `active`
- `assigned_agent_id` se asigna
- Usuario recibe notificación

### 4. Chat en tiempo real
- Mensajes instantáneos vía WebSocket
- Sin polling, solo eventos
- Scroll automático
- Estados de lectura

### 5. Cierre de conversación
- Agente hace clic en "Cerrar"
- Status cambia a `closed`
- Conversación archivada

## 🎨 Componentes Frontend

### `SupportChat.tsx`
Widget flotante de chat para usuarios:
- Botón circular con hover animado
- Modal expandible
- Conexión WebSocket
- Opciones rápidas del bot
- Notificaciones en tiempo real

### `SupportAdmin.tsx`
Panel de administración para agentes:
- Vista dividida (lista + chat)
- Tomar/cerrar conversaciones
- Responder en tiempo real
- Filtros por estado
- Contador de no leídos

## 🔌 WebSocket Events

### Cliente → Servidor
```typescript
send_message: { conversationId, message }
mark_read: { conversationId }
```

### Agente → Servidor
```typescript
take_conversation: { conversationId }
agent_reply: { conversationId, message }
close_conversation: { conversationId }
```

### Servidor → Cliente
```typescript
message_sent: { message, conversation }
new_message: { message, conversation }
agent_joined: { conversationId, agentId }
conversation_closed: { conversationId }
conversation_updated: { conversationId, status }
```

## 🔐 Seguridad

- ✅ Autenticación obligatoria en WebSocket
- ✅ Validación de sesión antes de conectar
- ✅ Rate limit por usuario
- ✅ Sanitización de mensajes
- ✅ Límite de 2000 caracteres
- ✅ Prevención de spam
- ✅ No exposición de IDs sensibles

## 📡 Endpoints tRPC

### Usuario
```typescript
support.getMyConversation()
support.startConversation()
support.requestAgent({ conversationId })
```

### Admin
```typescript
support.admin.getConversations({ status? })
support.admin.getConversation({ id })
```

## 🚀 Performance

- **Redis pub/sub**: Escalabilidad horizontal
- **Sin polling**: Solo WebSockets
- **Historial paginado**: No cargar todo de golpe
- **Índices optimizados**: Búsquedas rápidas
- **Conexiones persistentes**: Menos overhead

## 📍 Rutas

### Usuario
- Chat flotante: Disponible globalmente en todas las páginas
- Formulario de bugs: `/bug-report`

### Admin
- Panel de soporte: `/admin/support`
- Link en Admin dashboard con badge de no leídos

## 🎯 Características Implementadas

✅ Chat tipo Crisp/Intercom  
✅ Tiempo real verdadero con WebSockets  
✅ Bot automático con opciones rápidas  
✅ Escalamiento a agente humano  
✅ Historial persistente  
✅ Notificaciones con badges rojos  
✅ Panel admin con vista dividida  
✅ Estados de lectura  
✅ Seguridad robusta  
✅ Arquitectura escalable  

## 🔮 Escalabilidad Futura (Preparado pero no implementado)

- IA que sugiera respuestas
- Métricas de tiempo de respuesta
- Etiquetas de conversación
- Prioridades
- SLA

## 📝 Notas de Deployment

1. **Migración SQL**: Ejecutar `migrations/support_chat_system.sql`
2. **Redis**: Configurar `REDIS_URL` en variables de entorno
3. **WebSocket**: Puerto 3000 debe estar abierto
4. **CORS**: Configurar `CLIENT_URL` correctamente

## 🧪 Testing

Para probar el sistema:

1. **Como usuario**:
   - Abrir chat flotante
   - Enviar mensaje
   - Solicitar agente humano

2. **Como agente**:
   - Ir a `/admin/support`
   - Ver conversaciones en cola
   - Tomar conversación
   - Responder en tiempo real
   - Cerrar conversación

## 🐛 Troubleshooting

### WebSocket no conecta
- Verificar que Redis esté corriendo
- Revisar `REDIS_URL` en env vars
- Comprobar CORS configuration

### Mensajes no llegan
- Verificar conexión WebSocket en DevTools
- Revisar logs del servidor
- Comprobar que el usuario esté autenticado

### Badge no actualiza
- Verificar polling interval (3 segundos)
- Revisar eventos WebSocket
- Comprobar query de unreadCount

## 📚 Referencias

- Socket.IO: https://socket.io/
- Redis Adapter: https://socket.io/docs/v4/redis-adapter/
- tRPC: https://trpc.io/
