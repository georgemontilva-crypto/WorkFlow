# 🚀 Guía de Configuración: Railway + Dominio + SSL

## 📋 Problema Actual

1. ❌ Base de datos MySQL no conectada al proyecto WorkFlow
2. ❌ Dominio `hiwork.site` no funciona (solo funciona `www.hiwork.site`)
3. ❌ Sin certificado SSL (HTTPS)

## ✅ Solución Paso a Paso

---

## 1️⃣ Conectar Base de Datos MySQL a WorkFlow

### En Railway - Servicio WorkFlow

1. Ve a tu proyecto **WorkFlow** en Railway
2. Haz clic en el servicio **WorkFlow** (no en MySQL)
3. Ve a la pestaña **Variables**
4. Haz clic en **"+ New Variable"**
5. Agrega la siguiente variable:

**Variable a agregar:**
```
DATABASE_URL
```

**Valor (copia el valor de MYSQL_URL de tu servicio MySQL):**
```
mysql://root:LTctBojuWhrxYaLpkFHesSofK1DfLwlf@mysql.railway.internal:3306/railway
```

> ⚠️ **Importante:** Usa `MYSQL_URL` (la URL interna) NO `MYSQL_PUBLIC_URL`. La URL interna es más rápida y segura dentro de Railway.

6. Haz clic en **"Add"** o **"Save"**
7. Railway automáticamente reiniciará tu servicio

### Verificar otras variables necesarias

Asegúrate de que tu servicio **WorkFlow** también tenga estas variables:

```bash
JWT_SECRET=9208a8eb9171cd27031c6b6fc04a395b2651028b861b4c57056c91c61d0de7f2c9551d46de44eca1f354c3b779787c8ed5c1f614dc401821b5e88ddbe2ecb12

NODE_ENV=production

PORT=3000  # Opcional, Railway lo asigna automáticamente
```

---

## 2️⃣ Configurar Dominio y SSL en Hostinger

### Paso A: Configurar Registros DNS en Hostinger

1. **Inicia sesión en Hostinger**
   - Ve a [hpanel.hostinger.com](https://hpanel.hostinger.com)

2. **Accede a la Zona DNS**
   - Ve a **Dominios** → Selecciona `hiwork.site`
   - Haz clic en **Zona DNS** o **DNS Zone**

3. **Configurar Registro A (para hiwork.site sin www)**
   
   Busca o crea un registro tipo **A** con:
   ```
   Tipo: A
   Nombre: @ (o déjalo vacío)
   Apunta a: [IP de Railway]
   TTL: 3600 (o automático)
   ```
   
   > 📝 **Para obtener la IP de Railway:**
   > - Ve a tu proyecto WorkFlow en Railway
   > - Pestaña **Settings** → **Domains**
   > - Busca la IP pública o usa `railway.app` domain

4. **Configurar Registro CNAME (para www.hiwork.site)**
   
   Busca o crea un registro tipo **CNAME** con:
   ```
   Tipo: CNAME
   Nombre: www
   Apunta a: [tu-proyecto].railway.app
   TTL: 3600
   ```

5. **Ejemplo de configuración completa:**

   | Tipo | Nombre | Valor/Apunta a | TTL |
   |------|--------|----------------|-----|
   | A | @ | [IP Railway] | 3600 |
   | CNAME | www | workflow-production-xxxx.railway.app | 3600 |

### Paso B: Configurar Dominio Personalizado en Railway

1. **En Railway - Servicio WorkFlow**
   - Ve a la pestaña **Settings**
   - Busca la sección **Domains**
   - Haz clic en **"+ Custom Domain"**

2. **Agregar ambos dominios:**
   ```
   hiwork.site
   www.hiwork.site
   ```

3. **Railway generará automáticamente certificados SSL** (puede tardar 5-10 minutos)

### Paso C: Configurar Redirección en Hostinger (Opcional)

Si quieres que `hiwork.site` redirija automáticamente a `www.hiwork.site`:

1. En Hostinger, ve a **Dominios** → `hiwork.site`
2. Busca **Redirecciones** o **Redirects**
3. Crea una redirección:
   ```
   Desde: hiwork.site
   Hacia: https://www.hiwork.site
   Tipo: 301 (Permanente)
   ```

---

## 3️⃣ Alternativa: Configurar SSL en Railway (Recomendado)

Railway maneja SSL automáticamente cuando agregas un dominio personalizado.

### Pasos:

1. **Agrega el dominio en Railway:**
   - Settings → Domains → + Custom Domain
   - Ingresa: `hiwork.site` y `www.hiwork.site`

2. **Railway te dará instrucciones de DNS:**
   - Te mostrará qué registros agregar en Hostinger
   - Copia los valores exactos

3. **Agrega los registros en Hostinger:**
   - Sigue las instrucciones que Railway te proporciona

4. **Espera la propagación:**
   - Los cambios DNS pueden tardar de 5 minutos a 48 horas
   - Generalmente funcionan en 10-30 minutos

---

## 4️⃣ Verificar Conexión a Base de Datos

### Opción A: Desde Railway Logs

1. Ve a tu servicio **WorkFlow** en Railway
2. Haz clic en **Deployments**
3. Selecciona el deployment más reciente
4. Revisa los **Logs**
5. Busca mensajes como:
   ```
   Server running on port 3000
   Environment: production
   ```

### Opción B: Probar Endpoint de Salud

Una vez que el dominio funcione, visita:
```
https://www.hiwork.site/api/trpc/system.health
```

Deberías ver una respuesta JSON indicando que el sistema está funcionando.

---

## 5️⃣ Solución de Problemas

### ❌ "hiwork.site" no funciona

**Causa:** Falta el registro A o no está configurado correctamente

**Solución:**
1. Verifica que el registro A apunte a la IP correcta de Railway
2. Espera 10-30 minutos para propagación DNS
3. Usa [whatsmydns.net](https://www.whatsmydns.net) para verificar propagación

### ❌ Sin SSL / "No seguro"

**Causa:** Railway aún no ha generado el certificado SSL

**Solución:**
1. Verifica que agregaste el dominio en Railway Settings → Domains
2. Espera 5-10 minutos
3. Railway genera certificados Let's Encrypt automáticamente

### ❌ Error de conexión a base de datos

**Causa:** Variable `DATABASE_URL` no configurada o incorrecta

**Solución:**
1. Verifica que `DATABASE_URL` esté en las variables del servicio **WorkFlow**
2. Usa la URL interna (`MYSQL_URL`) no la pública
3. Reinicia el servicio en Railway

---

## 📝 Resumen de Variables Necesarias

### En WorkFlow Service:

```bash
DATABASE_URL=mysql://root:LTctBojuWhrxYaLpkFHesSofK1DfLwlf@mysql.railway.internal:3306/railway

JWT_SECRET=9208a8eb9171cd27031c6b6fc04a395b2651028b861b4c57056c91c61d0de7f2c9551d46de44eca1f354c3b779787c8ed5c1f614dc401821b5e88ddbe2ecb12

NODE_ENV=production
```

---

## ✅ Checklist Final

- [ ] Variable `DATABASE_URL` agregada en WorkFlow service
- [ ] Registro A configurado en Hostinger (@ → IP Railway)
- [ ] Registro CNAME configurado en Hostinger (www → railway.app)
- [ ] Dominios agregados en Railway Settings → Domains
- [ ] Esperado 10-30 minutos para propagación DNS
- [ ] SSL activo (candado verde en el navegador)
- [ ] Ambos dominios funcionan: `hiwork.site` y `www.hiwork.site`

---

## 🆘 ¿Necesitas Ayuda?

Si después de seguir estos pasos aún tienes problemas:

1. Verifica los logs en Railway
2. Usa herramientas de diagnóstico:
   - [whatsmydns.net](https://www.whatsmydns.net) - Verificar propagación DNS
   - [ssllabs.com](https://www.ssllabs.com/ssltest/) - Verificar SSL
3. Revisa que todos los registros DNS estén correctos en Hostinger

---

**¡Listo!** Una vez completados estos pasos, tu aplicación estará funcionando en:
- ✅ `https://hiwork.site` (con SSL)
- ✅ `https://www.hiwork.site` (con SSL)
- ✅ Base de datos MySQL conectada y funcionando
