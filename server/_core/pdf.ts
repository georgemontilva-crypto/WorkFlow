/**
 * PDF Generation Module
 * Handles PDF generation for invoices using jsPDF
 */

import type { Invoice } from "../../drizzle/schema";

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
  try {
    // Dynamic import of jsPDF
    const { default: jsPDF } = await import('jspdf');
    
    // Create new PDF document
    const doc = new jsPDF();
    
    // Set font
    doc.setFont('helvetica');
    
    // Header - Company Logo/Name
    doc.setFontSize(24);
    doc.setTextColor(0, 0, 0);
    doc.text('WorkFlow', 20, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('Sistema de Gestión Empresarial', 20, 27);
    
    // Invoice Title
    doc.setFontSize(20);
    doc.setTextColor(0, 0, 0);
    doc.text('FACTURA', 150, 20);
    
    // Invoice Number and Date
    doc.setFontSize(10);
    doc.text(`No. ${invoiceData.invoice_number}`, 150, 28);
    doc.text(`Fecha: ${new Date(invoiceData.issue_date).toLocaleDateString('es-ES')}`, 150, 34);
    doc.text(`Vencimiento: ${new Date(invoiceData.due_date).toLocaleDateString('es-ES')}`, 150, 40);
    
    // Line separator
    doc.setDrawColor(200, 200, 200);
    doc.line(20, 45, 190, 45);
    
    // Client Information
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text('Cliente:', 20, 55);
    
    doc.setFontSize(10);
    doc.text(invoiceData.clientName, 20, 62);
    if (invoiceData.companyName) {
      doc.text(invoiceData.companyName, 20, 68);
    }
    doc.text(invoiceData.clientEmail, 20, invoiceData.companyName ? 74 : 68);
    if (invoiceData.clientPhone) {
      doc.text(invoiceData.clientPhone, 20, invoiceData.companyName ? 80 : 74);
    }
    
    // Items Table Header
    const tableTop = invoiceData.companyName && invoiceData.clientPhone ? 95 : 85;
    
    doc.setFillColor(240, 240, 240);
    doc.rect(20, tableTop, 170, 8, 'F');
    
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text('Descripción', 22, tableTop + 5);
    doc.text('Cantidad', 120, tableTop + 5);
    doc.text('Precio Unit.', 145, tableTop + 5);
    doc.text('Total', 175, tableTop + 5);
    
    // Items
    let currentY = tableTop + 15;
    const items: InvoiceItem[] = typeof invoiceData.items === 'string' 
      ? JSON.parse(invoiceData.items) 
      : invoiceData.items;
    
    items.forEach((item: InvoiceItem) => {
      doc.setFontSize(9);
      doc.text(item.description.substring(0, 40), 22, currentY);
      doc.text(item.quantity.toString(), 125, currentY);
      doc.text(`$${item.unitPrice.toFixed(2)}`, 145, currentY);
      doc.text(`$${item.total.toFixed(2)}`, 175, currentY);
      currentY += 7;
    });
    
    // Line separator before totals
    doc.setDrawColor(200, 200, 200);
    doc.line(120, currentY + 5, 190, currentY + 5);
    
    // Totals
    currentY += 12;
    doc.setFontSize(10);
    doc.text('Subtotal:', 145, currentY);
    doc.text(`$${parseFloat(invoiceData.subtotal as any).toFixed(2)}`, 175, currentY);
    
    currentY += 7;
    doc.text('Impuestos:', 145, currentY);
    doc.text(`$${parseFloat(invoiceData.tax as any).toFixed(2)}`, 175, currentY);
    
    currentY += 7;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Total:', 145, currentY);
    doc.text(`$${parseFloat(invoiceData.total as any).toFixed(2)}`, 175, currentY);
    
    // Payment Status
    currentY += 10;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    const statusColors: Record<string, [number, number, number]> = {
      paid: [34, 197, 94],
      draft: [156, 163, 175],
      sent: [59, 130, 246],
      overdue: [239, 68, 68],
      cancelled: [107, 114, 128],
    };
    
    const statusLabels: Record<string, string> = {
      paid: 'PAGADA',
      draft: 'BORRADOR',
      sent: 'ENVIADA',
      overdue: 'VENCIDA',
      cancelled: 'CANCELADA',
    };
    
    const color = statusColors[invoiceData.status] || [0, 0, 0];
    doc.setTextColor(color[0], color[1], color[2]);
    doc.text(`Estado: ${statusLabels[invoiceData.status] || invoiceData.status.toUpperCase()}`, 20, currentY);
    
    // Notes (if any)
    if (invoiceData.notes) {
      currentY += 10;
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(9);
      doc.text('Notas:', 20, currentY);
      currentY += 5;
      const splitNotes = doc.splitTextToSize(invoiceData.notes, 170);
      doc.text(splitNotes, 20, currentY);
    }
    
    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('Gracias por su preferencia', 105, 280, { align: 'center' });
    doc.text('WorkFlow - Sistema de Gestión Empresarial', 105, 285, { align: 'center' });
    
    // Generate base64 string
    const pdfBase64 = doc.output('datauristring');
    return pdfBase64;
  } catch (error) {
    console.error('[PDF] Error generating invoice PDF:', error);
    throw new Error('Failed to generate PDF');
  }
}

/**
 * Generate PDF buffer for download
 */
export async function generateInvoicePDFBuffer(invoiceData: InvoiceData): Promise<Buffer> {
  const base64PDF = await generateInvoicePDF(invoiceData);
  // Remove data URI prefix
  const base64Data = base64PDF.split(',')[1];
  return Buffer.from(base64Data, 'base64');
}
