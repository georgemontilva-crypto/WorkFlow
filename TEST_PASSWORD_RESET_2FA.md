# Plan de Pruebas - Verificación 2FA en Recuperación de Contraseña

## Resumen de la Implementación

Se ha agregado una capa adicional de seguridad al flujo de recuperación de contraseña para usuarios que tienen **2FA habilitado**. El sistema ahora requiere validación del código TOTP antes de enviar el email de recuperación.

---

## Arquitectura Técnica

### Backend

#### 1. Endpoint: `requestPasswordReset`
**Ubicación:** `server/routers.ts`

**Flujo:**
1. Recibe el email del usuario
2. Verifica si el usuario existe
3. **Si el usuario tiene 2FA habilitado (`two_factor_enabled = 1`):**
   - Genera un token temporal de 32 caracteres (nanoid)
   - Almacena en Redis con TTL de 5 minutos:
     ```
     Key: password_reset_2fa:{tempToken}
     Value: { userId, email, timestamp, attempts: 0 }
     TTL: 300 segundos
     ```
   - Retorna: `{ success: true, requires2FA: true, tempToken }`
   - Log: `[Security] Password reset requested for user X with 2FA enabled`

4. **Si el usuario NO tiene 2FA:**
   - Genera token de reset de 64 caracteres
   - Guarda en DB (`password_reset_tokens`)
   - Envía email con enlace de recuperación
   - Retorna: `{ success: true, requires2FA: false }`
   - Log: `[Security] Password reset email sent to user X`

#### 2. Endpoint: `verifyPasswordReset2FA` (NUEVO)
**Ubicación:** `server/routers.ts`

**Flujo:**
1. Recibe `tempToken` y `code` (6 dígitos)
2. Busca el token en Redis
3. Valida que no haya expirado (5 min)
4. Verifica intentos (máximo 3)
5. Obtiene el usuario y su `two_factor_secret`
6. Valida el código TOTP usando `speakeasy`:
   ```typescript
   speakeasy.totp.verify({
     secret: user.two_factor_secret,
     encoding: 'base32',
     token: code,
     window: 1
   })
   ```

**Si el código es válido:**
- Genera token de reset de 64 caracteres
- Guarda en DB (`password_reset_tokens`)
- Envía email con enlace de recuperación
- Elimina el token temporal de Redis
- Log: `[Security] Password reset 2FA verified for user X, email sent`
- Retorna: `{ success: true, message: "Verification successful..." }`

**Si el código es inválido:**
- Incrementa contador de intentos en Redis
- Log: `[Security] Password reset 2FA failed for user X (attempt N)`
- Retorna: `{ success: false, message: "Invalid 2FA code" }`

**Si se alcanzan 3 intentos:**
- Elimina el token temporal de Redis
- Log: `[Security] Password reset 2FA max attempts reached for user X`
- Retorna: `{ success: false, message: "Too many failed attempts..." }`

---

### Frontend

#### Componente: `ForgotPassword.tsx`
**Ubicación:** `client/src/pages/ForgotPassword.tsx`

**Estados:**
```typescript
type Step = 'email' | '2fa' | 'success';
```

**Flujo de 3 Pasos:**

##### Paso 1: Email
- Input de correo electrónico
- Botón "Enviar Enlace de Recuperación" (outline)
- Al enviar:
  - Llama a `requestPasswordReset`
  - Si `requires2FA = true`: avanza a paso 2
  - Si `requires2FA = false`: avanza a paso 3

##### Paso 2: 2FA (Condicional)
- Icono de escudo naranja
- Mensaje: "Tu cuenta tiene seguridad adicional habilitada..."
- Input de código de 6 dígitos:
  - Formato mono espaciado
  - Solo números
  - Validación automática
- Contador de intentos visible: "Intentos restantes: X"
- Botón "Verificar Código" (outline, deshabilitado si código < 6 dígitos)
- Botón "Cancelar" (ghost) para volver al paso 1

##### Paso 3: Éxito
- Icono de correo verde
- Mensaje de confirmación
- Botón "Intentar con Otro Correo"
- Botón "Volver al Login"

---

## Casos de Prueba

### Caso 1: Usuario SIN 2FA
**Precondición:** Usuario registrado sin 2FA habilitado

**Pasos:**
1. Ir a `/forgot-password`
2. Ingresar email del usuario
3. Hacer clic en "Enviar Enlace de Recuperación"

**Resultado Esperado:**
- ✅ Avanza directamente al paso de éxito
- ✅ Email de recuperación enviado inmediatamente
- ✅ Log: `[Security] Password reset email sent to user X`
- ✅ Token de reset guardado en DB

---

### Caso 2: Usuario CON 2FA - Código Correcto
**Precondición:** Usuario registrado con 2FA habilitado

**Pasos:**
1. Ir a `/forgot-password`
2. Ingresar email del usuario
3. Hacer clic en "Enviar Enlace de Recuperación"
4. **Verificar que aparece el paso de 2FA**
5. Abrir Google Authenticator / Authy
6. Ingresar código de 6 dígitos
7. Hacer clic en "Verificar Código"

**Resultado Esperado:**
- ✅ Paso 2 (2FA) aparece después del email
- ✅ Código validado correctamente
- ✅ Avanza al paso de éxito
- ✅ Email de recuperación enviado
- ✅ Token temporal eliminado de Redis
- ✅ Log: `[Security] Password reset 2FA verified for user X, email sent`

---

### Caso 3: Usuario CON 2FA - Código Incorrecto (1 intento)
**Precondición:** Usuario registrado con 2FA habilitado

**Pasos:**
1. Ir a `/forgot-password`
2. Ingresar email del usuario
3. Hacer clic en "Enviar Enlace de Recuperación"
4. Ingresar código INCORRECTO (ej: `000000`)
5. Hacer clic en "Verificar Código"

**Resultado Esperado:**
- ✅ Toast de error: "Código inválido"
- ✅ Contador de intentos: "Intentos restantes: 2"
- ✅ Permanece en el paso de 2FA
- ✅ Log: `[Security] Password reset 2FA failed for user X (attempt 1)`
- ✅ Token temporal actualizado en Redis con `attempts: 1`

---

### Caso 4: Usuario CON 2FA - Máximo de Intentos (3)
**Precondición:** Usuario registrado con 2FA habilitado

**Pasos:**
1. Ir a `/forgot-password`
2. Ingresar email del usuario
3. Hacer clic en "Enviar Enlace de Recuperación"
4. Ingresar código INCORRECTO 3 veces

**Resultado Esperado:**
- ✅ Después del 3er intento: Toast "Demasiados intentos fallidos..."
- ✅ Vuelve al paso 1 (email)
- ✅ Formulario reseteado
- ✅ Token temporal eliminado de Redis
- ✅ Log: `[Security] Password reset 2FA max attempts reached for user X`

---

### Caso 5: Token Temporal Expirado (5 minutos)
**Precondición:** Usuario registrado con 2FA habilitado

**Pasos:**
1. Ir a `/forgot-password`
2. Ingresar email del usuario
3. Hacer clic en "Enviar Enlace de Recuperación"
4. **Esperar 6 minutos** (o simular con Redis CLI)
5. Ingresar código correcto
6. Hacer clic en "Verificar Código"

**Resultado Esperado:**
- ✅ Toast de error: "Invalid or expired verification token"
- ✅ Token no encontrado en Redis (TTL expirado)
- ✅ Usuario debe reiniciar el proceso

---

### Caso 6: Email No Existente
**Precondición:** Email que no está registrado

**Pasos:**
1. Ir a `/forgot-password`
2. Ingresar email inexistente (ej: `noexiste@test.com`)
3. Hacer clic en "Enviar Enlace de Recuperación"

**Resultado Esperado:**
- ✅ Avanza al paso de éxito (para no revelar si el email existe)
- ✅ NO se envía ningún email
- ✅ NO se genera ningún token
- ✅ Mensaje genérico: "Si tu correo existe, recibirás un enlace..."

---

## Seguridad Implementada

### 1. No Revelación de Información
- ✅ Mismo mensaje de éxito para emails existentes y no existentes
- ✅ No se indica si el usuario tiene 2FA hasta después de validar el email
- ✅ Mensajes de error genéricos

### 2. Limitación de Intentos
- ✅ Máximo 3 intentos de código 2FA
- ✅ Token temporal eliminado después de 3 intentos fallidos
- ✅ Usuario debe reiniciar el proceso completo

### 3. Expiración de Tokens
- ✅ Token temporal en Redis: 5 minutos (300 segundos)
- ✅ Token de reset en DB: 24 horas (igual que antes)
- ✅ Tokens de un solo uso (`used = 0` en DB)

### 4. Logging de Eventos
- ✅ Todos los eventos críticos registrados con prefijo `[Security]`
- ✅ Incluye user ID para auditoría
- ✅ Registra intentos fallidos y exitosos

### 5. Validación TOTP
- ✅ Usa `speakeasy` (misma librería que el sistema 2FA existente)
- ✅ Window de 1 (acepta código actual y anterior/siguiente por desfase de tiempo)
- ✅ Encoding base32 estándar

---

## Comandos de Prueba con Redis CLI

### Ver token temporal:
```bash
redis-cli GET "password_reset_2fa:{tempToken}"
```

### Ver TTL del token:
```bash
redis-cli TTL "password_reset_2fa:{tempToken}"
```

### Simular expiración (eliminar manualmente):
```bash
redis-cli DEL "password_reset_2fa:{tempToken}"
```

### Ver todos los tokens de password reset:
```bash
redis-cli KEYS "password_reset_2fa:*"
```

---

## Checklist de Despliegue

- ✅ Endpoint `requestPasswordReset` modificado
- ✅ Endpoint `verifyPasswordReset2FA` creado
- ✅ Componente `ForgotPassword.tsx` actualizado con 3 pasos
- ✅ Logging de eventos de seguridad implementado
- ✅ Validación de intentos (máximo 3)
- ✅ TTL de 5 minutos en Redis
- ✅ Mensajes no reveladores
- ✅ Botones outline (Design System)
- ✅ Commit y push al repositorio
- ✅ Railway auto-deploy activado

---

## Próximos Pasos Recomendados

1. **Probar en producción** con usuario real que tenga 2FA
2. **Monitorear logs** de Railway para verificar eventos de seguridad
3. **Validar emails** de recuperación (formato, enlaces, etc.)
4. **Probar en móvil** (responsive design)
5. **Documentar en wiki** del proyecto

---

## Notas Técnicas

- **Redis:** Ya estaba configurado para el sistema de IA, reutilizado para tokens temporales
- **TOTP:** Usa la misma configuración que el sistema 2FA existente (speakeasy)
- **Design System:** Todos los botones son outline, border-radius de 6px en inputs
- **Tipografía:** Inter en toda la interfaz
- **Iconos:** Lucide (Shield, Mail, ArrowLeft, Loader2)

---

**Fecha de implementación:** 23 de enero de 2026  
**Versión:** 1.0  
**Commit:** `0d8ed15` - feat: Add 2FA verification to password reset flow
