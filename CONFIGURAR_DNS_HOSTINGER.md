# 🌐 Configurar DNS en Hostinger para hiwork.site

## 📋 Información de Railway

Según la captura que compartiste, Railway te pide configurar:

```
Type: CNAME
Name: @ (o vacío)
Value: zaw658fg.up.railway.app
```

---

## ✅ Pasos para Configurar en Hostinger

### 1️⃣ Acceder a la Zona DNS

1. **Inicia sesión en Hostinger**
   - Ve a [hpanel.hostinger.com](https://hpanel.hostinger.com)
   - Ingresa con tu usuario y contraseña

2. **Navega a tu dominio**
   - En el panel principal, busca **"Dominios"**
   - Haz clic en tu dominio: **hiwork.site**

3. **Accede a la Zona DNS**
   - Busca la opción **"Zona DNS"** o **"DNS Zone"**
   - Haz clic para abrir la configuración DNS

---

### 2️⃣ Configurar el Registro CNAME

Railway te pide un registro **CNAME** con `@` como nombre. Sin embargo, **no es posible crear un CNAME con @ en la raíz del dominio** según los estándares DNS.

**Solución: Usar registro A en lugar de CNAME para la raíz**

#### Opción A: Configurar con CNAME (para www)

Si Railway te permite usar `www` en lugar de `@`:

```
Type: CNAME
Name: www
Value: zaw658fg.up.railway.app
TTL: 3600 (o Automático)
```

#### Opción B: Configurar con A Record (para raíz @)

Para que `hiwork.site` (sin www) funcione, necesitas:

1. **Obtener la IP de Railway:**
   - Haz ping a `zaw658fg.up.railway.app`
   - O usa: `nslookup zaw658fg.up.railway.app`
   - Anota la dirección IP

2. **Crear registro A:**
   ```
   Type: A
   Name: @ (o déjalo vacío)
   Value: [IP obtenida]
   TTL: 3600
   ```

#### Opción C: Configuración Completa (Recomendado)

Para que funcionen **ambos** (con y sin www):

**Registro 1 - Para hiwork.site (raíz):**
```
Type: A
Name: @
Value: [IP de Railway]
TTL: 3600
```

**Registro 2 - Para www.hiwork.site:**
```
Type: CNAME
Name: www
Value: zaw658fg.up.railway.app
TTL: 3600
```

---

### 3️⃣ Cómo Agregar los Registros en Hostinger

1. **En la Zona DNS, busca el botón "Agregar registro" o "Add Record"**

2. **Para el registro A (raíz):**
   - **Tipo:** Selecciona `A`
   - **Nombre:** Escribe `@` o déjalo vacío
   - **Apunta a / Value:** Ingresa la IP de Railway
   - **TTL:** Deja en `3600` o `Automático`
   - Haz clic en **"Agregar"** o **"Add"**

3. **Para el registro CNAME (www):**
   - **Tipo:** Selecciona `CNAME`
   - **Nombre:** Escribe `www`
   - **Apunta a / Value:** Ingresa `zaw658fg.up.railway.app`
   - **TTL:** Deja en `3600` o `Automático`
   - Haz clic en **"Agregar"** o **"Add"**

4. **Elimina registros antiguos conflictivos:**
   - Si hay registros A o CNAME antiguos para `@` o `www`, elimínalos
   - Solo debe haber UNO de cada tipo

---

### 4️⃣ Obtener la IP de Railway

**Método 1: Desde tu computadora (Windows/Mac/Linux)**

Abre la terminal o CMD y ejecuta:

```bash
nslookup zaw658fg.up.railway.app
```

O:

```bash
ping zaw658fg.up.railway.app
```

Verás algo como:
```
Address: 104.21.45.123
```

Esa es la IP que debes usar en el registro A.

**Método 2: Desde una herramienta online**

Ve a: [https://mxtoolbox.com/DNSLookup.aspx](https://mxtoolbox.com/DNSLookup.aspx)

1. Ingresa: `zaw658fg.up.railway.app`
2. Selecciona tipo: `A`
3. Haz clic en "DNS Lookup"
4. Copia la dirección IP mostrada

---

## 🔍 Verificar la Configuración

### Después de Configurar en Hostinger:

1. **Espera 5-10 minutos** (puede tardar hasta 48 horas, pero usualmente es rápido)

2. **Verifica la propagación DNS:**
   - Ve a [https://www.whatsmydns.net](https://www.whatsmydns.net)
   - Ingresa: `hiwork.site`
   - Selecciona tipo: `A`
   - Haz clic en "Search"
   - Deberías ver la IP de Railway en varios servidores

3. **Verifica el CNAME de www:**
   - En la misma herramienta
   - Ingresa: `www.hiwork.site`
   - Selecciona tipo: `CNAME`
   - Deberías ver: `zaw658fg.up.railway.app`

---

## ⏱️ Tiempos de Propagación

- **Hostinger → Servidores DNS:** 5-30 minutos
- **Propagación mundial:** Hasta 48 horas (raro)
- **SSL de Railway:** 5-10 minutos después de detectar el DNS

---

## 🔒 Certificado SSL

Una vez que Railway detecte el registro DNS:

1. El mensaje **"Record not yet detected"** cambiará a ✅
2. Railway generará automáticamente un certificado SSL (Let's Encrypt)
3. En 5-10 minutos, tu sitio estará disponible en:
   - ✅ `https://hiwork.site`
   - ✅ `https://www.hiwork.site`

---

## 🆘 Solución de Problemas

### ❌ "Record not yet detected" después de 30 minutos

**Posibles causas:**
- Los registros DNS no se configuraron correctamente
- Hay registros conflictivos en Hostinger
- La propagación DNS aún no llega a los servidores de Railway

**Solución:**
1. Verifica en Hostinger que los registros estén correctos
2. Elimina cualquier registro duplicado o conflictivo
3. Usa [whatsmydns.net](https://www.whatsmydns.net) para verificar propagación
4. Espera 10-30 minutos más

### ❌ El sitio no carga después de configurar DNS

**Posibles causas:**
- La propagación DNS aún no se completa
- Hay un error en la configuración de Railway

**Solución:**
1. Verifica que el servicio WorkFlow esté corriendo en Railway
2. Revisa los logs en Railway → Deployments
3. Verifica que la variable `DATABASE_URL` esté configurada

### ❌ "Este sitio no es seguro" / Sin SSL

**Posibles causas:**
- Railway aún no ha generado el certificado SSL
- Estás accediendo con `http://` en lugar de `https://`

**Solución:**
1. Espera 10 minutos después de que Railway detecte el DNS
2. Accede siempre con `https://hiwork.site`
3. Limpia la caché del navegador (Ctrl + Shift + Del)

---

## 📝 Resumen de Configuración

### En Hostinger (Zona DNS):

| Tipo | Nombre | Valor | TTL |
|------|--------|-------|-----|
| A | @ | [IP de zaw658fg.up.railway.app] | 3600 |
| CNAME | www | zaw658fg.up.railway.app | 3600 |

### En Railway:

- ✅ Dominio agregado: `hiwork.site`
- ✅ Dominio agregado: `www.hiwork.site`
- ⏳ Esperando detección DNS
- ⏳ Generando certificado SSL

---

## ✅ Checklist

- [ ] Obtener IP de `zaw658fg.up.railway.app`
- [ ] Crear registro A en Hostinger (@ → IP)
- [ ] Crear registro CNAME en Hostinger (www → zaw658fg.up.railway.app)
- [ ] Eliminar registros DNS antiguos/conflictivos
- [ ] Esperar 10-30 minutos para propagación
- [ ] Verificar en whatsmydns.net
- [ ] Railway detecta DNS (✅ en lugar de "Record not yet detected")
- [ ] Railway genera SSL automáticamente
- [ ] Acceder a https://hiwork.site y https://www.hiwork.site

---

**¡Listo!** Una vez completados estos pasos, tu sitio estará funcionando con SSL en ambos dominios.

Si necesitas ayuda con algún paso específico, avísame. 🚀
