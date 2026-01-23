/**
 * PDF Generation Module
 * Handles PDF generation for invoices using PDFKit
 */

import type { Invoice } from "../../drizzle/schema";
import PDFDocument from 'pdfkit';

interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface CompanyProfile {
  company_name: string;
  logo_url?: string;
  email: string;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  tax_id?: string;
  invoice_footer?: string;
}

interface InvoiceData extends Invoice {
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  companyName?: string;
  items: InvoiceItem[];
  companyProfile?: CompanyProfile;
}

/**
 * Generate PDF for an invoice
 * Returns base64 encoded PDF
 */
export async function generateInvoicePDF(invoiceData: InvoiceData): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      // Create PDF document
      const doc = new PDFDocument({ 
        margin: 72,
        bufferPages: true
      });
      
      // Buffer to store PDF data
      const chunks: Buffer[] = [];
      
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(chunks);
        const base64 = pdfBuffer.toString('base64');
        resolve(base64);
      });
      doc.on('error', (error) => {
        console.error('[PDF] Error in PDF stream:', error);
        reject(new Error('Failed to generate PDF'));
      });

      // Header - Company Logo/Name
      const profile = invoiceData.companyProfile;
      if (profile) {
        doc.fontSize(20).fillColor('#AF8F6F').text(profile.company_name, 72, 72);
        let yPos = 97;
        if (profile.email) {
          doc.fontSize(9).fillColor('#666').text(profile.email, 72, yPos);
          yPos += 12;
        }
        if (profile.phone) {
          doc.text(profile.phone, 72, yPos);
          yPos += 12;
        }
        if (profile.address) {
          doc.text(profile.address, 72, yPos);
          yPos += 12;
        }
        if (profile.city || profile.state || profile.postal_code) {
          const location = [profile.city, profile.state, profile.postal_code].filter(Boolean).join(', ');
          doc.text(location, 72, yPos);
          yPos += 12;
        }
        if (profile.tax_id) {
          doc.text(`RIF/NIT: ${profile.tax_id}`, 72, yPos);
        }
      } else {
        doc.fontSize(24).text('Finwrk', 72, 72);
        doc.fontSize(10).fillColor('#666').text('Sistema de Gestión Empresarial', 72, 100);
      }
      
      // Invoice Title
      doc.fontSize(20).fillColor('#000').text('FACTURA', 72, 72, { align: 'right', width: doc.page.width - 144 });
      
      // Invoice Number and Date
      doc.fontSize(10).fillColor('#666');
      doc.text(`Factura #: ${invoiceData.invoice_number}`, 72, 97, { align: 'right', width: doc.page.width - 144 });
      doc.text(`Fecha: ${new Date(invoiceData.issue_date).toLocaleDateString('es-ES')}`, 72, 112, { align: 'right', width: doc.page.width - 144 });
      doc.text(`Vencimiento: ${new Date(invoiceData.due_date).toLocaleDateString('es-ES')}`, 72, 127, { align: 'right', width: doc.page.width - 144 });
      
      // Client Information
      doc.fontSize(12).fillColor('#000').text('Facturar a:', 72, 170);
      doc.fontSize(10).fillColor('#333');
      doc.text(invoiceData.clientName, 72, 190);
      if (invoiceData.companyName) {
        doc.text(invoiceData.companyName, 72, 205);
      }
      doc.text(invoiceData.clientEmail, 72, invoiceData.companyName ? 220 : 205);
      if (invoiceData.clientPhone) {
        doc.text(invoiceData.clientPhone, 72, invoiceData.companyName ? 235 : 220);
      }
      
      // Items Table
      const tableTop = 290;
      const tableHeaders = ['Descripción', 'Cantidad', 'Precio Unit.', 'Total'];
      const columnWidths = [250, 80, 100, 100];
      const columnPositions = [72, 320, 400, 480];
      
      // Table Header
      doc.fontSize(10).fillColor('#000').font('Helvetica-Bold');
      tableHeaders.forEach((header, i) => {
        doc.text(header, columnPositions[i], tableTop);
      });
      
      // Table Header Line
      doc.moveTo(72, tableTop + 15).lineTo(doc.page.width - 72, tableTop + 15).stroke();
      
      // Table Rows
      doc.font('Helvetica').fontSize(9).fillColor('#333');
      let yPosition = tableTop + 25;
      
      invoiceData.items.forEach((item) => {
        doc.text(item.description, columnPositions[0], yPosition, { width: 240 });
        doc.text(item.quantity.toString(), columnPositions[1], yPosition);
        doc.text(`$${item.unitPrice.toFixed(2)}`, columnPositions[2], yPosition);
        doc.text(`$${item.total.toFixed(2)}`, columnPositions[3], yPosition);
        yPosition += 25;
      });
      
      // Totals
      yPosition += 20;
      doc.moveTo(72, yPosition).lineTo(doc.page.width - 72, yPosition).stroke();
      yPosition += 15;
      
      const subtotal = parseFloat(invoiceData.subtotal);
      const tax = parseFloat(invoiceData.tax);
      const total = parseFloat(invoiceData.total);
      
      doc.fontSize(10).fillColor('#666');
      doc.text('Subtotal:', 380, yPosition);
      doc.text(`$${subtotal.toFixed(2)}`, 480, yPosition, { align: 'right' });
      
      yPosition += 20;
      doc.text('Impuestos:', 380, yPosition);
      doc.text(`$${tax.toFixed(2)}`, 480, yPosition, { align: 'right' });
      
      yPosition += 20;
      doc.fontSize(12).fillColor('#000').font('Helvetica-Bold');
      doc.text('TOTAL:', 380, yPosition);
      doc.text(`$${total.toFixed(2)}`, 480, yPosition, { align: 'right' });
      
      // Payment Link
      if (invoiceData.payment_link) {
        yPosition += 40;
        doc.fontSize(10).fillColor('#666').font('Helvetica');
        doc.text('Link de Pago:', 72, yPosition);
        doc.fillColor('#0066cc').text(invoiceData.payment_link, 72, yPosition + 15, {
          link: invoiceData.payment_link,
          underline: true
        });
      }
      
      // Notes
      if (invoiceData.notes) {
        yPosition += 60;
        doc.fontSize(10).fillColor('#666').font('Helvetica-Bold');
        doc.text('Notas:', 72, yPosition);
        doc.font('Helvetica').fillColor('#333');
        doc.text(invoiceData.notes, 72, yPosition + 15, { width: doc.page.width - 144 });
      }
      
      // Footer
      doc.fontSize(8).fillColor('#999');
      const footerText = invoiceData.companyProfile?.invoice_footer || 'Gracias por su preferencia';
      doc.text(
        footerText,
        72,
        doc.page.height - 72,
        { align: 'center', width: doc.page.width - 144 }
      );
      
      // Finalize PDF
      doc.end();
      
    } catch (error) {
      console.error('[PDF] Error generating invoice PDF:', error);
      reject(new Error('Failed to generate PDF'));
    }
  });
}
