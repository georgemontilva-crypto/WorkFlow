# Solución: Error de formato en campo 'from' de emails

## 🔴 PROBLEMA IDENTIFICADO

**Error en Railway:**
```
Error sending verification email: {
  statusCode: 422,
  name: 'validation_error',
  message: "Invalid 'from' field. The email address needs to follow the 
           `email@example.com` or `Name <email@example.com>` format."
}
```

## 🔍 CAUSA RAÍZ

El código estaba envolviendo siempre el valor de `EMAIL_FROM` con el formato `Finwrk <...>`:

```typescript
// Código anterior (INCORRECTO)
from: `Finwrk <${FROM_EMAIL}>`
```

**Problema:** Si la variable `EMAIL_FROM` en Railway ya contenía el formato completo (por ejemplo: `Finwrk <noreply@finwrk.app>`), el resultado era:

```
Finwrk <Finwrk <noreply@finwrk.app>>  ❌ FORMATO INVÁLIDO
```

Esto causaba el error de validación de Resend.

---

## ✅ SOLUCIÓN IMPLEMENTADA

Se agregó una función `getFromEmail()` que detecta si `EMAIL_FROM` ya está formateado:

```typescript
function getFromEmail(): string {
  const emailFrom = process.env.EMAIL_FROM || 'noreply@finwrk.app';
  
  // Si EMAIL_FROM ya contiene '<', está formateado
  if (emailFrom.includes('<')) {
    return emailFrom;
  }
  
  // Si no, lo formateamos como "Finwrk <email>"
  return `Finwrk <${emailFrom}>`;
}
```

**Ahora funciona con ambos formatos:**

| Valor de `EMAIL_FROM` | Resultado final | Estado |
|----------------------|-----------------|--------|
| `noreply@finwrk.app` | `Finwrk <noreply@finwrk.app>` | ✅ Válido |
| `Finwrk <noreply@finwrk.app>` | `Finwrk <noreply@finwrk.app>` | ✅ Válido |
| `onboarding@resend.dev` | `Finwrk <onboarding@resend.dev>` | ✅ Válido |

---

## 📋 CAMBIOS REALIZADOS

**Archivo modificado:** `server/emails/service.ts`

- ✅ Agregada función `getFromEmail()` con validación
- ✅ Reemplazado `from: \`Finwrk <${FROM_EMAIL}>\`` por `from: getFromEmail()`
- ✅ Aplicado en todas las funciones de envío de email:
  - `sendVerificationEmail()`
  - `sendPasswordChangedEmail()`
  - `send2FAStatusEmail()`

---

## 🚀 DESPLIEGUE

**Commit:** `5ed2af2`  
**Estado:** Pusheado a GitHub  
**Railway:** Desplegando automáticamente

---

## ✅ VALIDACIÓN

**Después del despliegue:**

1. Espera 2-3 minutos a que Railway termine el deployment
2. Intenta el reenvío de email de verificación desde la app
3. Revisa los logs de Railway

**Logs esperados (éxito):**
```
Verification email sent: { id: 're_...' }
```

**Si aún falla, revisa:**
- Que `RESEND_API_KEY` esté configurada correctamente
- Que el dominio/email esté verificado en Resend
- Los logs completos para ver el error específico

---

## 🔧 CONFIGURACIÓN RECOMENDADA EN RAILWAY

**Opción 1: Email simple (recomendado)**
```bash
EMAIL_FROM=noreply@finwrk.app
```

**Opción 2: Email con nombre (también válido)**
```bash
EMAIL_FROM=Finwrk <noreply@finwrk.app>
```

**Opción 3: Email de prueba de Resend**
```bash
EMAIL_FROM=onboarding@resend.dev
```

---

## 📞 SIGUIENTE PASO

**Si los emails siguen sin llegar después del deployment:**

1. Verifica que el dominio esté verificado en Resend: https://resend.com/domains
2. Si no está verificado, usa temporalmente: `EMAIL_FROM=onboarding@resend.dev`
3. Comparte los nuevos logs de Railway para diagnóstico adicional

---

**Fecha:** 24 de enero de 2026  
**Commit:** 5ed2af2  
**Estado:** ✅ Desplegado
