# Sistema de Encabezado Personalizado en Facturas

## Descripción General

Sistema que genera automáticamente encabezados personalizados y profesionales en las facturas utilizando la información del Perfil Empresarial del usuario. El encabezado se captura como una instantánea (snapshot) al momento de crear la factura, asegurando que la información permanezca consistente incluso si el perfil se actualiza posteriormente.

## Arquitectura

### 1. Base de Datos

**Tabla**: `invoices`

**Nuevo campo**:
```sql
company_profile_snapshot TEXT NULL
```

Este campo almacena un JSON con la información del perfil empresarial al momento de crear la factura:

```json
{
  "company_name": "Mi Empresa",
  "logo_url": "https://...",
  "business_type": "freelancer",
  "email": "contacto@empresa.com",
  "phone": "+58 414 1234567",
  "website": "https://empresa.com",
  "address": "Calle Principal 123",
  "city": "Caracas",
  "state": "Miranda",
  "postal_code": "1060",
  "country": "Venezuela",
  "tax_id": "J-12345678-9"
}
```

### 2. Backend

**Archivo**: `server/routers.ts`

**Función**: `invoices.create`

Al crear una factura, el sistema:
1. Obtiene el perfil empresarial del usuario mediante `getCompanyProfile(userId)`
2. Extrae solo los campos relevantes para el encabezado
3. Serializa la información como JSON
4. Guarda el snapshot en el campo `company_profile_snapshot`

```typescript
// Capturar instantánea del perfil
const profile = await getCompanyProfile(ctx.user.id);
if (profile) {
  companyProfileSnapshot = JSON.stringify({
    company_name: profile.company_name,
    logo_url: profile.logo_url,
    business_type: profile.business_type,
    email: profile.email,
    phone: profile.phone,
    // ... otros campos
  });
}
```

**Archivo**: `server/_core/pdf.ts`

**Función**: `generateInvoicePDF`

La generación de PDF:
1. Intenta parsear `company_profile_snapshot` de la factura
2. Si no existe snapshot, usa `companyProfile` como fallback
3. Genera un encabezado profesional de dos columnas

### 3. Frontend

**Componente**: `InvoiceHeaderPreview.tsx`

Vista previa en tiempo real del encabezado que se mostrará en la factura.

**Props**:
- `profile`: Objeto con información del perfil empresarial
- `invoiceNumber`: Número de factura (preview)
- `issueDate`: Fecha de emisión
- `dueDate`: Fecha de vencimiento
- `status`: Estado de la factura

**Características**:
- Diseño responsive (grid de 2 columnas en desktop, 1 en mobile)
- Solo muestra campos con información (no muestra campos vacíos)
- Iconos minimalistas para contacto
- Estados con colores diferenciados
- Mensaje informativo si no hay perfil configurado

**Integración**: `pages/Invoices.tsx`

El componente se integra en el diálogo de creación de facturas, mostrando una vista previa actualizada en tiempo real según los datos del formulario.

## Diseño del Encabezado

### Vista PDF

```
┌─────────────────────────────────────────────────────────────┐
│                                                               │
│  MI EMPRESA                          FACTURA                 │
│  Freelancer                          Número: INV-001         │
│  Venezuela                           Fecha emisión: 22/01/26 │
│  contacto@empresa.com                Vencimiento: 21/02/26   │
│  +58 414 1234567                     Estado: Enviada         │
│  RIF/NIT: J-12345678-9                                       │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Lado Izquierdo (Emisor)
- **Nombre comercial** (bold, 16px)
- **Tipo de actividad** (Freelancer/Empresa/Agencia)
- **País**
- **Email** (con icono)
- **Teléfono** (con icono, si existe)
- **RIF/NIT** (con icono, si existe)

### Lado Derecho (Factura)
- **Título "FACTURA"** (bold, 18px)
- **Número de factura**
- **Fecha de emisión** (con icono calendario)
- **Fecha de vencimiento** (con icono reloj)
- **Estado** (con color según estado)

## Tipos de Actividad

El campo `business_type` se traduce automáticamente:

| Valor en DB | Etiqueta mostrada |
|-------------|-------------------|
| freelancer  | Freelancer        |
| empresa     | Empresa           |
| agencia     | Agencia           |

## Estados de Factura

Los estados se traducen y colorean automáticamente:

| Estado        | Etiqueta      | Color      |
|---------------|---------------|------------|
| draft         | Borrador      | Gris       |
| sent          | Enviada       | Azul       |
| payment_sent  | Pago Enviado  | Índigo     |
| paid          | Pagada        | Verde      |
| overdue       | Vencida       | Rojo       |
| cancelled     | Cancelada     | Gris claro |

## Flujo de Uso

### 1. Configuración Inicial
1. Usuario completa su **Perfil Empresarial** en la página de perfil
2. Incluye: nombre, tipo de actividad, país, email, teléfono, RIF/NIT

### 2. Creación de Factura
1. Usuario abre el diálogo de "Nueva Factura"
2. Ve la **vista previa del encabezado** con su información
3. Completa los datos de la factura (cliente, items, fechas)
4. Al guardar, se captura automáticamente el snapshot del perfil

### 3. Visualización
- **Vista web**: Encabezado se muestra en la vista pública de la factura
- **PDF exportado**: Encabezado profesional en la primera página
- **Email al cliente**: PDF con encabezado personalizado

### 4. Actualizaciones del Perfil
- Si el usuario actualiza su perfil empresarial después de crear facturas
- Las facturas existentes **mantienen** el encabezado original (snapshot)
- Las nuevas facturas usarán el perfil actualizado

## Ventajas del Sistema

### 1. Profesionalismo
- Facturas con identidad corporativa automática
- Diseño limpio y consistente
- Información completa del emisor

### 2. Automatización
- No es necesario reingresar información en cada factura
- Captura automática del perfil al crear factura
- Vista previa en tiempo real

### 3. Consistencia
- Las facturas mantienen la información original (snapshot)
- No se afectan por cambios posteriores en el perfil
- Historial confiable y auditable

### 4. Flexibilidad
- Solo muestra campos con información
- Adaptable a diferentes tipos de negocio
- Diseño responsive para web y PDF

## Archivos Modificados

### Backend
- `drizzle/schema.ts` - Agregar campo `company_profile_snapshot`
- `server/routers.ts` - Capturar snapshot al crear factura
- `server/_core/pdf.ts` - Rediseño completo del encabezado PDF

### Frontend
- `client/src/components/invoices/InvoiceHeaderPreview.tsx` - Nuevo componente
- `client/src/pages/Invoices.tsx` - Integración de vista previa

### Migración
- `migration_add_company_profile_snapshot.sql` - Script SQL para agregar campo

## Mantenimiento

### Agregar Nuevos Campos al Encabezado

1. **Actualizar el snapshot en `routers.ts`**:
```typescript
companyProfileSnapshot = JSON.stringify({
  // ... campos existentes
  nuevo_campo: profile.nuevo_campo,
});
```

2. **Actualizar la interfaz en `InvoiceHeaderPreview.tsx`**:
```typescript
interface CompanyProfileSnapshot {
  // ... campos existentes
  nuevo_campo?: string | null;
}
```

3. **Actualizar el renderizado en `pdf.ts`**:
```typescript
if (profile.nuevo_campo) {
  doc.text(profile.nuevo_campo, leftMargin, leftYPos);
  leftYPos += 14;
}
```

### Troubleshooting

**Problema**: Vista previa no muestra información
- **Causa**: Perfil empresarial no configurado
- **Solución**: Usuario debe completar su perfil en Configuración > Perfil Empresarial

**Problema**: PDF no muestra encabezado personalizado
- **Causa**: Factura creada antes de implementar el sistema
- **Solución**: El snapshot es `null`, se usa fallback genérico

**Problema**: Información desactualizada en facturas antiguas
- **Causa**: Esto es comportamiento esperado (snapshot inmutable)
- **Solución**: Las facturas mantienen la información original por diseño

## Próximas Mejoras

### Corto Plazo
- [ ] Soporte para logo/foto en PDF (actualmente solo en preview web)
- [ ] Opción de regenerar snapshot para facturas específicas
- [ ] Plantillas de encabezado personalizables

### Largo Plazo
- [ ] Múltiples perfiles empresariales por usuario
- [ ] Temas de color para encabezados
- [ ] Campos personalizados en el encabezado
- [ ] Exportación a más formatos (Word, HTML)

## Fecha de Implementación

**Versión**: 1.0.0  
**Fecha**: 22 de enero de 2026  
**Autor**: Sistema Finwrk
