# 🔧 Guía: Configurar Redis en Railway para Recordatorios

## ⚠️ Problema Actual

Los recordatorios no se están creando porque la aplicación no puede conectarse a Redis. El error en los logs es:

```
Error: connect ECONNREFUSED 127.0.0.1:6379
```

Esto significa que la aplicación está buscando Redis en `localhost`, pero en Railway cada servicio está en un contenedor separado.

## ✅ Solución: Configurar REDIS_URL

### Paso 1: Verificar que Redis está instalado en Railway

1. Ve a tu proyecto en Railway: https://railway.app
2. Busca un servicio llamado **"Redis"** en tu proyecto
3. Si **NO existe**, necesitas agregarlo:
   - Haz clic en **"+ New"**
   - Selecciona **"Database"**
   - Selecciona **"Add Redis"**
   - Railway creará automáticamente el servicio

### Paso 2: Obtener la URL de Redis

1. Haz clic en el servicio **Redis** en tu proyecto
2. Ve a la pestaña **"Variables"**
3. Busca la variable **`REDIS_URL`**
4. Copia el valor completo (se verá algo así):
   ```
   redis://default:contraseña@redis.railway.internal:6379
   ```

### Paso 3: Configurar REDIS_URL en tu aplicación

1. Haz clic en tu servicio principal (el que corre la aplicación Node.js)
2. Ve a la pestaña **"Variables"**
3. Haz clic en **"+ New Variable"**
4. Agrega:
   - **Name:** `REDIS_URL`
   - **Value:** Pega el valor que copiaste del servicio Redis
5. Haz clic en **"Add"**

### Paso 4: Redeploy la aplicación

1. Ve a la pestaña **"Deployments"**
2. Haz clic en los tres puntos (**...**) del último deployment
3. Selecciona **"Redeploy"**
4. Espera a que termine el deployment

### Paso 5: Verificar que funciona

1. Ve a la pestaña **"Logs"** de tu aplicación
2. Busca estos mensajes:
   ```
   [Redis] Using REDIS_URL from environment
   [Redis] ✅ Connected successfully
   [Redis] ✅ Ready to accept commands
   [Server] ✅ Reminder worker initialized
   ```

3. Si ves estos mensajes, ¡Redis está funcionando correctamente! 🎉

## 🔍 Diagnóstico de Problemas

### Si ves: "Using localhost in production"

Significa que `REDIS_URL` no está configurada. Sigue los pasos anteriores.

### Si ves: "Connection test failed"

1. Verifica que copiaste la URL completa de Redis
2. Asegúrate de que el servicio Redis está corriendo
3. Verifica que ambos servicios están en el mismo proyecto de Railway

### Si ves: "Max retry attempts reached"

1. Verifica que la URL de Redis es la **interna** (redis.railway.internal)
2. NO uses la URL pública (proxy.railway.app)
3. Asegúrate de que no hay espacios al inicio o final de la URL

## 📝 Variables de Entorno Necesarias

Tu aplicación en Railway debe tener estas variables configuradas:

```bash
# Base de datos MySQL
DATABASE_URL=mysql://user:password@mysql.railway.internal:3306/railway

# Redis (REQUERIDO para recordatorios)
REDIS_URL=redis://default:password@redis.railway.internal:6379

# Seguridad
JWT_SECRET=tu_jwt_secret_aqui
ENCRYPTION_KEY=tu_encryption_key_aqui

# Entorno
NODE_ENV=production
```

## 🚀 Después de Configurar

Una vez que Redis esté configurado correctamente:

1. Los recordatorios se crearán automáticamente
2. Las notificaciones por correo se enviarán en la fecha/hora programada
3. Podrás ver las estadísticas de la cola en los logs

## 💡 Consejos

- **Nunca uses `localhost` en producción** - Cada servicio en Railway tiene su propia red interna
- **Usa siempre URLs internas** - `*.railway.internal` para comunicación entre servicios
- **Revisa los logs** - Son tu mejor amigo para diagnosticar problemas
- **Mantén las variables actualizadas** - Si cambias la contraseña de Redis, actualiza `REDIS_URL`

## 📚 Recursos Adicionales

- [Documentación de Railway sobre Redis](https://docs.railway.app/databases/redis)
- [Documentación de Bull Queue](https://github.com/OptimalBits/bull)
- [Documentación de ioredis](https://github.com/redis/ioredis)

---

**¿Necesitas ayuda?** Revisa los logs en Railway y busca mensajes que empiecen con `[Redis]` o `[Queue]` para más información.
