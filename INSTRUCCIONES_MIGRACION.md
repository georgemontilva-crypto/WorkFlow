# Instrucciones para Aplicar los Cambios

## Resumen de Cambios Realizados

### 1. Corrección de Textos Hardcodeados en Clients.tsx ✅

Se han reemplazado **todos los textos en español hardcodeados** por claves de traducción del sistema i18n. Los cambios incluyen:

- Mensajes de toast (éxito y error)
- Labels de formularios
- Textos de ayuda
- Mensajes de confirmación
- Opciones de select
- Mensajes de estado vacío

**Archivos modificados:**
- `client/src/pages/Clients.tsx` - Componente principal corregido
- `client/src/locales/es.ts` - Nuevas claves de traducción en español
- `client/src/locales/en.ts` - Nuevas claves de traducción en inglés

### 2. Corrección del Error al Crear Invoices ✅

**Problema identificado:** La tabla `invoices` en la base de datos no tenía los campos `paid_amount` y `balance`, aunque el schema de Drizzle sí los definía.

**Solución implementada:**
- Migración SQL para agregar los campos faltantes
- Script automatizado para aplicar la migración

**Archivos creados:**
- `migrations/add_paid_amount_balance_to_invoices.sql` - Migración SQL
- `apply-invoice-migration.mjs` - Script para aplicar la migración

---

## Cómo Aplicar los Cambios

### Paso 1: Aplicar la Migración de Base de Datos

**Opción A: Usando el script automatizado (Recomendado)**

```bash
# Desde la raíz del proyecto
node apply-invoice-migration.mjs
```

**Opción B: Aplicar manualmente con MySQL**

```bash
# Conectarse a la base de datos
mysql -u tu_usuario -p tu_base_de_datos

# Ejecutar la migración
source migrations/add_paid_amount_balance_to_invoices.sql;
```

**Opción C: Si usas Railway u otro servicio**

1. Copia el contenido de `migrations/add_paid_amount_balance_to_invoices.sql`
2. Ejecuta las queries directamente en el panel de administración de tu base de datos

### Paso 2: Verificar los Cambios

```bash
# Instalar dependencias (si es necesario)
pnpm install

# Ejecutar el proyecto en desarrollo
pnpm dev
```

### Paso 3: Probar las Funcionalidades

1. **Clientes:**
   - Cambiar el idioma entre español e inglés
   - Verificar que todos los textos se traduzcan correctamente
   - Crear, editar y eliminar clientes

2. **Facturas:**
   - Intentar crear una nueva factura
   - Verificar que se cree sin errores
   - Comprobar que los campos `paid_amount` y `balance` funcionen correctamente

---

## Detalles Técnicos

### Campos Agregados a la Tabla `invoices`

```sql
paid_amount DECIMAL(10,2) NOT NULL DEFAULT '0'
balance DECIMAL(10,2) NOT NULL
```

- **paid_amount:** Monto pagado parcialmente (por defecto 0)
- **balance:** Saldo pendiente (total - paid_amount)

### Nuevas Claves de Traducción

Se agregaron 24 nuevas claves en ambos idiomas (español e inglés):

- `clients.clientAddError`
- `clients.clientUpdateError`
- `clients.clientDeleteError`
- `clients.completeRequiredFields`
- `clients.loadingClients`
- `clients.nameHelper`
- `clients.emailHelper`
- `clients.phoneHelper`
- `clients.companyHelper`
- `clients.billingInformation`
- `clients.billingInformationSubtitle`
- `clients.nextPaymentDateHelper`
- `clients.daysInAdvanceLabel`
- `clients.daysInAdvanceHelper`
- `clients.billingCycleHelper`
- `clients.customCycleDays`
- `clients.statusHelper`
- `clients.notesHelper`
- `clients.noClientsFound`
- `clients.tryAnotherSearch`
- `clients.updateButton`
- `clients.addButton`
- `clients.clientLabel`

---

## Notas Importantes

⚠️ **Backup:** Se recomienda hacer un backup de la base de datos antes de aplicar la migración.

⚠️ **Producción:** Si la aplicación ya está en producción, asegúrate de aplicar la migración en un horario de bajo tráfico.

✅ **Compatibilidad:** La migración es compatible con datos existentes. Las facturas antiguas tendrán `paid_amount = 0` y `balance = total`.

---

## Soporte

Si encuentras algún problema al aplicar estos cambios, verifica:

1. Que la conexión a la base de datos esté configurada correctamente
2. Que el usuario de la base de datos tenga permisos para modificar tablas (ALTER TABLE)
3. Que no haya facturas en proceso de creación durante la migración

Para más ayuda, revisa los logs de error o contacta al equipo de desarrollo.
