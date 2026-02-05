# Instrucciones de Migración - Wallet de Direcciones

## 🗄️ Crear Tabla en Base de Datos

Para que el **Wallet de Direcciones** funcione correctamente, necesitas ejecutar la migración SQL en tu base de datos MySQL.

## 📝 Opción 1: Ejecutar SQL Manualmente

### Paso 1: Acceder a tu base de datos

Puedes usar cualquiera de estos métodos:

**A) MySQL CLI:**
```bash
mysql -u tu_usuario -p tu_base_de_datos
```

**B) phpMyAdmin:**
- Accede a phpMyAdmin
- Selecciona tu base de datos
- Ve a la pestaña "SQL"

**C) Panel de hosting (cPanel, Plesk, etc.):**
- Accede al gestor de bases de datos
- Selecciona tu base de datos
- Busca la opción "Ejecutar SQL"

### Paso 2: Ejecutar el script SQL

Copia y pega el siguiente SQL:

```sql
-- Migration: Create crypto_wallet_addresses table
-- Description: Tabla para almacenar direcciones públicas de criptomonedas
-- IMPORTANTE: Este NO es un wallet real - solo almacena direcciones públicas para referencia
-- NO custodia fondos, NO maneja llaves privadas, NO firma transacciones

CREATE TABLE IF NOT EXISTS `crypto_wallet_addresses` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `crypto_symbol` VARCHAR(20) NOT NULL COMMENT 'Símbolo de la criptomoneda (BTC, ETH, USDT, etc.)',
  `network` VARCHAR(50) NOT NULL COMMENT 'Red/Blockchain (Bitcoin, ERC20, TRC20, BEP20, etc.)',
  `address` VARCHAR(255) NOT NULL COMMENT 'Dirección pública de la wallet',
  `alias` VARCHAR(100) DEFAULT NULL COMMENT 'Alias opcional (ej: Binance, Personal, Cliente)',
  `note` TEXT DEFAULT NULL COMMENT 'Nota opcional',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Índices para optimizar consultas
  INDEX `idx_user` (`user_id`),
  INDEX `idx_user_crypto` (`user_id`, `crypto_symbol`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Almacena direcciones públicas de criptomonedas (NO custodia fondos)';
```

### Paso 3: Verificar que se creó correctamente

```sql
SHOW TABLES LIKE 'crypto_wallet_addresses';
```

Deberías ver la tabla listada.

Para ver su estructura:
```sql
DESCRIBE crypto_wallet_addresses;
```

## 📝 Opción 2: Usar el archivo SQL

El archivo de migración está en:
```
/migrations/create_crypto_wallet_addresses.sql
```

Puedes ejecutarlo directamente:

```bash
mysql -u tu_usuario -p tu_base_de_datos < migrations/create_crypto_wallet_addresses.sql
```

## 📝 Opción 3: Usar Drizzle Kit (Recomendado para desarrollo)

Si tienes configuradas las credenciales de base de datos en tu entorno de desarrollo:

```bash
cd /home/ubuntu/WorkFlow
pnpm run db:push
```

Esto ejecutará automáticamente todas las migraciones pendientes.

## ✅ Verificación

Después de ejecutar la migración, verifica que todo funcione:

1. **Accede a la aplicación**
2. **Ve a Mercados**
3. **Haz clic en "Wallet de direcciones"**
4. **Intenta añadir una dirección de prueba**

Si todo funciona correctamente, deberías poder:
- ✅ Añadir direcciones
- ✅ Ver las direcciones guardadas
- ✅ Editar direcciones
- ✅ Copiar direcciones
- ✅ Eliminar direcciones

## 🐛 Troubleshooting

### Error: "Table already exists"
- No hay problema, la tabla ya existe
- Puedes ignorar este error

### Error: "Access denied"
- Verifica que tu usuario de MySQL tenga permisos para crear tablas
- Contacta a tu proveedor de hosting si es necesario

### Error: "Unknown database"
- Verifica que el nombre de la base de datos sea correcto
- Verifica que la base de datos exista

### La funcionalidad no aparece
- Verifica que hayas ejecutado la migración
- Verifica que la tabla exista: `SHOW TABLES LIKE 'crypto_wallet_addresses';`
- Reinicia el servidor de la aplicación
- Limpia la caché del navegador

## 📊 Estructura de la Tabla

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | INT | ID único (auto-increment) |
| `user_id` | INT | ID del usuario propietario |
| `crypto_symbol` | VARCHAR(20) | Símbolo de la cripto (BTC, ETH, etc.) |
| `network` | VARCHAR(50) | Red/blockchain (Bitcoin, ERC20, etc.) |
| `address` | VARCHAR(255) | Dirección pública de la wallet |
| `alias` | VARCHAR(100) | Alias opcional (ej: "Binance") |
| `note` | TEXT | Nota opcional |
| `created_at` | TIMESTAMP | Fecha de creación |
| `updated_at` | TIMESTAMP | Fecha de última actualización |

### Índices
- `idx_user`: Índice en `user_id` para consultas rápidas por usuario
- `idx_user_crypto`: Índice compuesto en `user_id` y `crypto_symbol` para filtrar por cripto

## 🔒 Seguridad

**IMPORTANTE**: Esta tabla solo almacena direcciones públicas.

- ❌ NO almacena llaves privadas
- ❌ NO almacena seeds/mnemonics
- ❌ NO almacena passwords de wallets
- ✅ Solo direcciones públicas visibles en blockchain

Es seguro almacenar direcciones públicas porque:
- Son visibles públicamente en la blockchain
- No permiten acceso a fondos
- No permiten firmar transacciones
- Solo sirven para recibir fondos (no enviar)

## 📝 Notas Importantes

1. **Backup**: Haz un backup de tu base de datos antes de ejecutar cualquier migración
2. **Producción**: Si estás en producción, considera ejecutar la migración en un horario de bajo tráfico
3. **Testing**: Prueba primero en un ambiente de desarrollo/staging
4. **Rollback**: Si algo sale mal, puedes eliminar la tabla con: `DROP TABLE crypto_wallet_addresses;`

## 🚀 Después de la Migración

Una vez ejecutada la migración exitosamente:

1. ✅ La funcionalidad estará completamente operativa
2. ✅ Los usuarios podrán añadir y gestionar direcciones
3. ✅ Las direcciones se guardarán en la base de datos
4. ✅ Las direcciones persistirán entre sesiones

---

**¿Necesitas ayuda?**

Si tienes problemas ejecutando la migración o la funcionalidad no funciona correctamente, revisa:
1. Logs del servidor
2. Consola del navegador (F12)
3. Verifica que la tabla existe en la base de datos
4. Verifica que el servidor esté conectado a la base de datos correcta
