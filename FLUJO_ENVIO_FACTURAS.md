# 📧 FLUJO COMPLETO DE ENVÍO DE FACTURAS

## ✅ CONFIRMACIÓN

**SÍ, el sistema envía automáticamente el email al cliente cuando usas "Crear y Enviar".**

---

## 🔄 FLUJO COMPLETO

### 1. **Frontend (Invoices.tsx)**

Cuando haces clic en "Crear y Enviar":

```typescript
// Líneas 381-387
if (action === 'create_and_send' && result?.id) {
  try {
    await sendByEmail.mutateAsync({ id: result.id });
    toast.success('Factura creada y enviada al cliente');
  } catch (error) {
    toast.error('Factura creada pero falló el envío del email');
  }
}
```

**Pasos:**
1. Crea la factura en la base de datos
2. Llama a `sendByEmail` con el ID de la factura
3. Muestra mensaje de éxito o error

---

### 2. **Backend (routers.ts - sendByEmail)**

```typescript
// Líneas 1144-1248
sendByEmail: protectedProcedure
  .input(z.object({ id: z.number() }))
  .mutation(async ({ ctx, input }) => {
    // 1. Obtener factura
    const invoice = await db.getInvoiceById(input.id, ctx.user.id);
    
    // 2. Obtener datos del cliente
    const client = await db.getClientById(invoice.client_id, ctx.user.id);
    
    // 3. Obtener perfil de la empresa
    const companyProfile = await db.getCompanyProfile(ctx.user.id);
    
    // 4. Generar PDF de la factura
    const pdfBase64 = await generateInvoicePDF(invoiceData);
    
    // 5. Enviar email al cliente
    const emailSent = await sendEmail({
      to: client.email,  // ← Email del cliente
      subject: `Factura ${invoice.invoice_number} - Finwrk`,
      html: emailHtml,
      attachments: [{
        filename: `factura-${invoice.invoice_number}.pdf`,
        content: pdfBase64,
        encoding: 'base64',
      }],
    });
    
    // 6. Actualizar estado de la factura a 'sent'
    await db.updateInvoice(input.id, ctx.user.id, { status: 'sent' });
    
    return { success: true };
  })
```

**Pasos:**
1. ✅ Obtiene la factura de la base de datos
2. ✅ Obtiene el email del cliente (`client.email`)
3. ✅ Genera el PDF de la factura
4. ✅ Envía el email al cliente con el PDF adjunto
5. ✅ Cambia el estado de la factura a "Enviada"

---

## 📧 CONTENIDO DEL EMAIL

El cliente recibe un email con:

### **Asunto:**
```
Factura INV-XXXXXXXXX - Finwrk
```

### **Cuerpo:**
- Saludo personalizado: "Hola [Nombre del Cliente]"
- Número de factura
- Total a pagar
- Fecha de emisión
- Fecha de vencimiento
- **Botón "Ver Factura"** (si tiene payment_token)
- PDF adjunto: `factura-INV-XXXXXXXXX.pdf`

### **Adjunto:**
- PDF de la factura generado automáticamente

---

## 🎯 DESTINATARIO

**El email se envía a:** `client.email`

En tu caso:
- **Cliente:** Andres Tobon
- **Email:** andrstobon1@gmail.com ← **Aquí llegará el email**

---

## ✅ CONFIRMACIÓN DE ENVÍO

El sistema:
1. ✅ Envía el email automáticamente
2. ✅ Actualiza el estado de la factura a "Enviada"
3. ✅ Muestra un toast de confirmación
4. ✅ Si falla el envío, muestra un error pero la factura se crea igual

---

## 🔧 REQUISITOS

Para que el envío funcione, debe estar configurado:

- **Variable de entorno:** `RESEND_API_KEY`
- **Servicio:** Resend (proveedor de email)
- **Dominio:** Verificado en Resend

Si no está configurado, el sistema mostrará:
```
"No se pudo enviar el email. Verifica que RESEND_API_KEY esté configurado"
```

---

## 📊 RESUMEN

| Paso | Acción | Estado |
|------|--------|--------|
| 1 | Usuario crea factura y selecciona cliente | ✅ |
| 2 | Usuario hace clic en "Crear y Enviar" | ✅ |
| 3 | Sistema crea factura en BD | ✅ |
| 4 | Sistema obtiene email del cliente | ✅ |
| 5 | Sistema genera PDF | ✅ |
| 6 | Sistema envía email con PDF adjunto | ✅ |
| 7 | Cliente recibe email en su correo | ✅ |
| 8 | Estado de factura cambia a "Enviada" | ✅ |

---

**SÍ, el flujo está completo y funcional.** 🎉
