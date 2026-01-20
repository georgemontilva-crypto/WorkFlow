# 💬 Integración de Crisp Chat

## 📋 Pasos para activar Crisp

### 1. Crear cuenta en Crisp
1. Ve a [https://crisp.chat/](https://crisp.chat/)
2. Haz clic en **"Get Started Free"**
3. Regístrate con tu email: `soportehiwork@gmail.com`
4. Confirma tu email

### 2. Configurar tu sitio web
1. En el dashboard de Crisp, haz clic en **"Add a website"**
2. Nombre del sitio: `HiWork`
3. URL del sitio: `https://hiwork.site`
4. Haz clic en **"Create website"**

### 3. Obtener tu Website ID
1. Ve a **Settings** (⚙️) en el menú izquierdo
2. Haz clic en **"Setup instructions"**
3. Verás un código como este:

```javascript
window.$crisp=[];
window.CRISP_WEBSITE_ID="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx";
```

4. **Copia el ID** (el texto entre comillas después de `CRISP_WEBSITE_ID`)

### 4. Agregar el ID al código
1. Abre el archivo: `client/src/components/CrispChat.tsx`
2. Reemplaza esta línea:
```typescript
const CRISP_WEBSITE_ID = 'YOUR_WEBSITE_ID';
```
Con tu ID real:
```typescript
const CRISP_WEBSITE_ID = 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx';
```

### 5. Activar el componente
1. Abre el archivo: `client/src/App.tsx`
2. Agrega el import:
```typescript
import { CrispChat } from "./components/CrispChat";
```
3. Agrega el componente antes del cierre de `</TooltipProvider>`:
```typescript
<TooltipProvider>
  <Toaster />
  <Router />
  <CrispChat />  {/* ← Agregar esta línea */}
</TooltipProvider>
```

### 6. Hacer commit y push
```bash
git add -A
git commit -m "feat: integrate Crisp chat"
git push origin main
```

---

## 🎨 Personalización del widget

### Cambiar colores
1. En Crisp dashboard → **Settings** → **Widget appearance**
2. Cambia el color principal a negro: `#000000`
3. Guarda los cambios

### Cambiar posición
1. En **Widget appearance** → **Position**
2. Selecciona: **Bottom right** (recomendado)

### Agregar tu logo
1. En **Widget appearance** → **Avatar**
2. Sube el logo de HiWork

### Mensaje de bienvenida
1. Ve a **Settings** → **Chatbox**
2. En **Welcome message** escribe:
```
¡Hola! 👋 Soy el asistente de HiWork. 
¿En qué puedo ayudarte hoy?
```

---

## 📱 Descargar la app móvil

### iOS
1. Descarga **Crisp** desde App Store
2. Inicia sesión con tu cuenta
3. Recibirás notificaciones de nuevos mensajes

### Android
1. Descarga **Crisp** desde Google Play
2. Inicia sesión con tu cuenta
3. Recibirás notificaciones de nuevos mensajes

---

## ✨ Funciones útiles

### Respuestas rápidas
1. Ve a **Settings** → **Shortcuts**
2. Crea respuestas predefinidas para preguntas frecuentes

### Horario de atención
1. Ve a **Settings** → **Availability**
2. Configura tu horario de trabajo
3. Fuera de horario, se mostrará un mensaje automático

### Integraciones
1. Ve a **Settings** → **Integrations**
2. Conecta con:
   - Email (para recibir notificaciones)
   - Slack (si usas Slack)
   - Telegram (para responder desde Telegram)

---

## 🆘 Soporte

Si tienes problemas con la integración:
1. Revisa la [documentación oficial de Crisp](https://docs.crisp.chat/)
2. Contacta al soporte de Crisp desde su dashboard

---

## 📊 Ventajas de Crisp vs Chat Personalizado

✅ **Sin mantenimiento** - Crisp se encarga de todo
✅ **App móvil nativa** - Responde desde tu teléfono
✅ **Notificaciones push** - No te pierdes ningún mensaje
✅ **Gratis para siempre** - Hasta 2 agentes
✅ **Diseño profesional** - Widget hermoso y moderno
✅ **Chatbot incluido** - Respuestas automáticas
✅ **Historial completo** - Todas las conversaciones guardadas
✅ **Sin código** - No necesitas programar nada más
