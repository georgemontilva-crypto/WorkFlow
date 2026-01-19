# 🔧 Corregir Configuración DNS en Hostinger

## 📊 Situación Actual

Según tu captura, tienes estos registros en Hostinger:

| Tipo | Nombre | Contenido | TTL | Estado |
|------|--------|-----------|-----|--------|
| ALIAS | @ | zaw658fg.up.railway.app | 3600 | ✅ Correcto |
| A | @ | 84.32.84.32 | 50 | ❌ IP incorrecta |

## ⚠️ Problemas Identificados

1. **IP incorrecta:** `84.32.84.32` no es la IP de Railway
2. **Registros duplicados:** Tienes ALIAS y A para la misma raíz (@)
3. **Falta registro para www:** No veo un registro CNAME para `www.hiwork.site`

---

## ✅ Solución: Configuración Correcta

### Opción 1: Usar solo ALIAS (Recomendado)

Hostinger soporta registros **ALIAS**, que es perfecto para la raíz del dominio.

**Configuración final:**

| Tipo | Nombre | Contenido | TTL |
|------|--------|-----------|-----|
| ALIAS | @ | zaw658fg.up.railway.app | 3600 |
| CNAME | www | zaw658fg.up.railway.app | 3600 |

**Pasos:**

1. ✅ **Mantén el registro ALIAS** (ya lo tienes)
2. ❌ **Elimina el registro A** con IP `84.32.84.32`
3. ➕ **Agrega un registro CNAME** para `www`

---

### Opción 2: Usar solo registro A

Si prefieres usar registro A en lugar de ALIAS:

**Configuración final:**

| Tipo | Nombre | Contenido | TTL |
|------|--------|-----------|-----|
| A | @ | 66.33.22.116 | 3600 |
| CNAME | www | zaw658fg.up.railway.app | 3600 |

**Pasos:**

1. ❌ **Elimina el registro ALIAS** con `zaw658fg.up.railway.app`
2. ✏️ **Edita el registro A** y cambia la IP a `66.33.22.116`
3. ➕ **Agrega un registro CNAME** para `www`

---

## 🎯 Recomendación: Usar ALIAS

**Te recomiendo la Opción 1 (ALIAS)** porque:

- ✅ Railway puede cambiar la IP en el futuro
- ✅ ALIAS se actualiza automáticamente
- ✅ Es más flexible y confiable
- ✅ Ya lo tienes configurado

---

## 📝 Pasos Detallados (Opción 1 - Recomendada)

### 1️⃣ Eliminar el registro A incorrecto

1. En la tabla de registros DNS de Hostinger
2. Busca el registro **A** con IP `84.32.84.32`
3. Haz clic en **"Delete"** o **"Eliminar"**
4. Confirma la eliminación

### 2️⃣ Agregar registro CNAME para www

1. En la sección **"Manage DNS records"**
2. En el formulario de arriba:
   - **Type:** Selecciona `CNAME`
   - **Name:** Escribe `www`
   - **Points to:** Escribe `zaw658fg.up.railway.app`
   - **TTL:** Deja `14400` o cámbialo a `3600`
3. Haz clic en **"Add Record"**

### 3️⃣ Verificar configuración final

Después de los cambios, deberías tener:

| Tipo | Nombre | Contenido | TTL |
|------|--------|-----------|-----|
| ALIAS | @ | zaw658fg.up.railway.app | 3600 |
| CNAME | www | zaw658fg.up.railway.app | 3600 |

---

## ⏱️ Tiempo de Propagación

- **Cambios en Hostinger:** Inmediato
- **Propagación DNS:** 5-30 minutos (puede tardar hasta 48h)
- **Detección de Railway:** 5-10 minutos después de propagación
- **Generación SSL:** 5-10 minutos después de detección

**Total estimado:** 15-60 minutos

---

## 🔍 Verificar Propagación DNS

### Método 1: Usar whatsmydns.net

1. Ve a [https://www.whatsmydns.net](https://www.whatsmydns.net)
2. Ingresa: `hiwork.site`
3. Selecciona tipo: `A` o `ALIAS`
4. Haz clic en "Search"
5. Deberías ver `zaw658fg.up.railway.app` o la IP `66.33.22.116`

### Método 2: Usar nslookup (desde tu computadora)

Abre la terminal o CMD y ejecuta:

```bash
nslookup hiwork.site
```

Deberías ver:
```
Name:    hiwork.site
Address: 66.33.22.116
```

### Método 3: Verificar www

```bash
nslookup www.hiwork.site
```

Deberías ver:
```
www.hiwork.site    canonical name = zaw658fg.up.railway.app
Name:    zaw658fg.up.railway.app
Address: 66.33.22.116
```

---

## 🔒 Verificar SSL en Railway

Después de que Railway detecte el DNS:

1. Ve a Railway → WorkFlow → Settings → Domains
2. Verás tus dominios con estado:
   - ✅ `hiwork.site` - Active
   - ✅ `www.hiwork.site` - Active
3. Railway habrá generado certificados SSL automáticamente

---

## 🌐 Probar el Sitio

Una vez que todo esté configurado (15-60 minutos):

1. Abre tu navegador
2. Ve a: `https://hiwork.site`
3. Ve a: `https://www.hiwork.site`
4. Ambos deberían:
   - ✅ Cargar tu aplicación
   - ✅ Mostrar el candado verde (SSL activo)
   - ✅ No mostrar advertencias de seguridad

---

## 🆘 Solución de Problemas

### ❌ Railway sigue mostrando "Record not yet detected"

**Causa:** La propagación DNS aún no llega a los servidores de Railway

**Solución:**
1. Verifica en whatsmydns.net que el DNS esté propagado
2. Espera 10-30 minutos más
3. Refresca la página de Railway

### ❌ El sitio no carga después de 1 hora

**Causa:** Posible error en la configuración DNS

**Solución:**
1. Verifica que los registros estén exactamente como se indica arriba
2. Elimina cualquier registro duplicado o conflictivo
3. Contacta al soporte de Hostinger si persiste

### ❌ "Este sitio no es seguro" / Sin candado verde

**Causa:** Railway aún no ha generado el certificado SSL

**Solución:**
1. Verifica que Railway haya detectado el DNS (✅)
2. Espera 10 minutos adicionales
3. Limpia la caché del navegador (Ctrl + Shift + Del)
4. Accede con `https://` (no `http://`)

---

## 📋 Checklist Final

- [ ] Registro ALIAS para @ → zaw658fg.up.railway.app (ya lo tienes)
- [ ] Registro A con IP incorrecta eliminado
- [ ] Registro CNAME para www → zaw658fg.up.railway.app agregado
- [ ] Esperado 15-30 minutos para propagación
- [ ] Verificado en whatsmydns.net
- [ ] Railway detectó el DNS (✅ en lugar de "Record not yet detected")
- [ ] Railway generó SSL automáticamente
- [ ] Sitio carga en https://hiwork.site
- [ ] Sitio carga en https://www.hiwork.site
- [ ] Candado verde visible en ambos

---

## 📊 Resumen Visual

**ANTES (Incorrecto):**
```
@ → ALIAS → zaw658fg.up.railway.app ✅
@ → A → 84.32.84.32 ❌ (conflicto + IP incorrecta)
www → (no existe) ❌
```

**DESPUÉS (Correcto):**
```
@ → ALIAS → zaw658fg.up.railway.app ✅
www → CNAME → zaw658fg.up.railway.app ✅
```

---

**¡Listo!** Con estos cambios, tu dominio funcionará correctamente con SSL en ambas versiones (con y sin www).

Si después de 1 hora sigue sin funcionar, avísame y revisamos juntos los logs de Railway. 🚀
