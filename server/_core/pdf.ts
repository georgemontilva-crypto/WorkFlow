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

interface InvoiceData extends Invoice {
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  companyName?: string;
  items: InvoiceItem[];
}

/**
 * Generate PDF for an invoice
 * Returns base64 encoded PDF
 */
export async function generateInvoicePDF(invoiceData: InvoiceData): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      // Create PDF document
      const doc = new PDFDocument({ margin: 50 });
      
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
      doc.fontSize(24).text('Finwrk', 50, 50);
      doc.fontSize(10).fillColor('#666').text('Sistema de Gestión Empresarial', 50, 78);
      
      // Invoice Title
      doc.fontSize(20).fillColor('#000').text('FACTURA', 400, 50, { align: 'right' });
      
      // Invoice Number and Date
      doc.fontSize(10).fillColor('#666');
      doc.text(`Factura #: ${invoiceData.invoice_number}`, 400, 75, { align: 'right' });
      doc.text(`Fecha: ${new Date(invoiceData.issue_date).toLocaleDateString('es-ES')}`, 400, 90, { align: 'right' });
      doc.text(`Vencimiento: ${new Date(invoiceData.due_date).toLocaleDateString('es-ES')}`, 400, 105, { align: 'right' });
      
      // Client Information
      doc.fontSize(12).fillColor('#000').text('Facturar a:', 50, 140);
      doc.fontSize(10).fillColor('#333');
      doc.text(invoiceData.clientName, 50, 160);
      if (invoiceData.companyName) {
        doc.text(invoiceData.companyName, 50, 175);
      }
      doc.text(invoiceData.clientEmail, 50, invoiceData.companyName ? 190 : 175);
      if (invoiceData.clientPhone) {
        doc.text(invoiceData.clientPhone, 50, invoiceData.companyName ? 205 : 190);
      }
      
      // Items Table
      const tableTop = 260;
      const tableHeaders = ['Descripción', 'Cantidad', 'Precio Unit.', 'Total'];
      const columnWidths = [250, 80, 100, 100];
      const columnPositions = [50, 300, 380, 480];
      
      // Table Header
      doc.fontSize(10).fillColor('#000').font('Helvetica-Bold');
      tableHeaders.forEach((header, i) => {
        doc.text(header, columnPositions[i], tableTop);
      });
      
      // Table Header Line
      doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();
      
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
      doc.moveTo(50, yPosition).lineTo(550, yPosition).stroke();
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
        doc.text('Link de Pago:', 50, yPosition);
        doc.fillColor('#0066cc').text(invoiceData.payment_link, 50, yPosition + 15, {
          link: invoiceData.payment_link,
          underline: true
        });
      }
      
      // Notes
      if (invoiceData.notes) {
        yPosition += 60;
        doc.fontSize(10).fillColor('#666').font('Helvetica-Bold');
        doc.text('Notas:', 50, yPosition);
        doc.font('Helvetica').fillColor('#333');
        doc.text(invoiceData.notes, 50, yPosition + 15, { width: 500 });
      }
      
      // Footer
      doc.fontSize(8).fillColor('#999');
      doc.text(
        'Gracias por su preferencia',
        50,
        doc.page.height - 50,
        { align: 'center', width: doc.page.width - 100 }
      );
      
      // Finalize PDF
      doc.end();
      
    } catch (error) {
      console.error('[PDF] Error generating invoice PDF:', error);
      reject(new Error('Failed to generate PDF'));
    }
  });
}
