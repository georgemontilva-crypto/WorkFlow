# 🌐 Agregar www.hiwork.site en Railway

## 🎯 Problema Actual

- ✅ `https://hiwork.site` funciona correctamente con SSL
- ❌ `www.hiwork.site` NO tiene certificado SSL
- ❌ Solo agregaste un dominio en Railway, faltan agregar `www.hiwork.site`

## 📊 Diagnóstico Técnico

```bash
# hiwork.site funciona:
$ curl -I https://hiwork.site
HTTP/2 200 ✅
server: railway-edge ✅

# www.hiwork.site falla:
$ curl -I https://www.hiwork.site
SSL: no alternative certificate subject name matches target host name 'www.hiwork.site' ❌
```

**Causa:** Railway solo generó certificado SSL para `hiwork.site`, no para `www.hiwork.site`.

---

## ✅ Solución: Agregar www.hiwork.site en Railway

### Paso 1: Ir a la configuración de dominios

1. Ve a tu proyecto **WorkFlow** en Railway
2. Haz clic en el servicio **WorkFlow** (el que tiene tu aplicación)
3. Ve a la pestaña **Settings**
4. Busca la sección **"Public Networking"** o **"Domains"**

### Paso 2: Agregar el dominio www

1. Haz clic en el botón **"+ Custom Domain"** (botón morado)
2. En el campo que aparece, escribe: `www.hiwork.site`
3. Presiona **Enter** o haz clic en **"Add"**

### Paso 3: Configurar DNS (si no lo hiciste)

Railway te mostrará instrucciones DNS. Deberías tener en Hostinger:

```
Type: CNAME
Name: www
Value: zaw658fg.up.railway.app
TTL: 3600
```

**Nota:** Si ya configuraste el CNAME en Hostinger (como te indiqué antes), este paso ya está listo.

### Paso 4: Esperar generación de SSL

1. Railway detectará el DNS (puede tardar 5-10 minutos)
2. Una vez detectado, generará automáticamente el certificado SSL
3. Verás el estado cambiar a **"Setup complete"** con un ✅

---

## 📋 Configuración Final en Railway

Después de agregar `www.hiwork.site`, deberías tener **DOS dominios** en Railway:

```
✅ hiwork.site
   → Port 8000 · Metal Edge
   Setup complete

✅ www.hiwork.site
   → Port 8000 · Metal Edge
   Setup complete
```

---

## 🔍 Verificar DNS en Hostinger

Asegúrate de tener estos registros en Hostinger:

| Tipo | Nombre | Contenido | TTL | Estado |
|------|--------|-----------|-----|--------|
| ALIAS | @ | zaw658fg.up.railway.app | 3600 | ✅ |
| CNAME | www | zaw658fg.up.railway.app | 3600 | ✅ |

**Importante:** NO debe haber registros A con IPs incorrectas.

---

## ⏱️ Tiempos Estimados

- **Agregar dominio en Railway:** Inmediato
- **Detección DNS:** 5-10 minutos
- **Generación SSL:** 5-10 minutos
- **Total:** 10-20 minutos

---

## 🧪 Probar Después de Configurar

Una vez que Railway muestre "Setup complete" para ambos dominios:

### Prueba 1: hiwork.site con HTTPS
```bash
curl -I https://hiwork.site
```
Debería responder: `HTTP/2 200` ✅

### Prueba 2: www.hiwork.site con HTTPS
```bash
curl -I https://www.hiwork.site
```
Debería responder: `HTTP/2 200` ✅

### Prueba 3: En el navegador

1. Abre: `https://hiwork.site`
   - ✅ Debe cargar tu aplicación
   - ✅ Debe mostrar candado verde

2. Abre: `https://www.hiwork.site`
   - ✅ Debe cargar tu aplicación
   - ✅ Debe mostrar candado verde

---

## 🔒 Sobre el SSL

Railway usa **Let's Encrypt** para generar certificados SSL automáticamente:

- ✅ Gratuito
- ✅ Renovación automática cada 90 días
- ✅ Válido para navegadores modernos
- ✅ Calificación A+ en SSL Labs

---

## 🆘 Solución de Problemas

### ❌ Railway no detecta el DNS de www

**Causa:** El registro CNAME no está configurado correctamente en Hostinger

**Solución:**
1. Ve a Hostinger → Zona DNS
2. Verifica que exista el registro CNAME:
   - Nombre: `www`
   - Apunta a: `zaw658fg.up.railway.app`
3. Elimina cualquier registro A para `www` (si existe)
4. Espera 10-15 minutos

### ❌ "SSL: no alternative certificate subject name"

**Causa:** Railway aún no ha generado el certificado SSL para www

**Solución:**
1. Verifica que agregaste `www.hiwork.site` en Railway
2. Verifica que el DNS esté configurado correctamente
3. Espera 10-15 minutos para que Railway genere el certificado
4. Limpia la caché del navegador

### ❌ El navegador dice "No seguro" o "Not Secure"

**Causa:** Estás accediendo con `http://` en lugar de `https://`

**Solución:**
1. Siempre usa `https://hiwork.site` (con la "s")
2. Railway debería redirigir automáticamente de HTTP a HTTPS
3. Si no redirige, necesitas configurar redirección en tu aplicación

---

## 🔄 Redirección HTTP → HTTPS (Opcional)

Si quieres que `http://hiwork.site` redirija automáticamente a `https://hiwork.site`, necesitas agregar middleware en tu aplicación Express.

**Archivo:** `server/index.ts` o `server/_core/index.ts`

Agrega este middleware **antes** de las rutas:

```typescript
// Forzar HTTPS en producción
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      res.redirect(`https://${req.header('host')}${req.url}`);
    } else {
      next();
    }
  });
}
```

---

## 📝 Resumen de Pasos

1. ✅ Ir a Railway → WorkFlow → Settings → Domains
2. ✅ Hacer clic en **"+ Custom Domain"**
3. ✅ Agregar: `www.hiwork.site`
4. ✅ Verificar que el CNAME esté en Hostinger
5. ⏳ Esperar 10-20 minutos
6. ✅ Verificar que ambos dominios muestren "Setup complete"
7. ✅ Probar en el navegador con HTTPS

---

## ✅ Checklist Final

- [ ] Dominio `hiwork.site` agregado en Railway (ya lo tienes ✅)
- [ ] Dominio `www.hiwork.site` agregado en Railway
- [ ] Registro ALIAS para @ en Hostinger
- [ ] Registro CNAME para www en Hostinger
- [ ] Railway muestra "Setup complete" para ambos
- [ ] `https://hiwork.site` carga correctamente
- [ ] `https://www.hiwork.site` carga correctamente
- [ ] Ambos muestran candado verde (SSL activo)

---

**¡Listo!** Una vez que agregues `www.hiwork.site` en Railway, ambos dominios funcionarán perfectamente con SSL. 🚀

Si después de 20 minutos sigue sin funcionar, avísame y revisamos juntos. 💪
