/**
 * Invoice PDF Generation Service
 * Generates clean, professional PDF invoices
 */

import { jsPDF } from 'jspdf';

interface InvoiceData {
  invoice_number: string;
  issue_date: Date;
  due_date: Date;
  status: string;
  currency: string;
  subtotal: string;
  total: string;
  notes?: string | null;
  terms?: string | null;
  client: {
    name: string;
    email: string;
    phone?: string | null;
    company?: string | null;
  };
  items: Array<{
    description: string;
    quantity: string;
    unit_price: string;
    total: string;
  }>;
  user: {
    name: string;
    email: string;
  };
}

/**
 * Format currency
 */
function formatCurrency(amount: string, currency: string): string {
  const num = parseFloat(amount);
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: currency,
  }).format(num);
}

/**
 * Format date
 */
function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date));
}

/**
 * Generate invoice PDF
 * Returns base64 encoded PDF
 */
export async function generateInvoicePDF(data: InvoiceData): Promise<string> {
  try {
    console.log(`[PDF] Generating PDF for invoice: ${data.invoice_number}`);
    
    const doc = new jsPDF();
    
    let yPosition = 20;
    
    // Header - Company name
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('FACTURA', 20, yPosition);
    
    yPosition += 15;
    
    // Invoice number and dates
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Número: ${data.invoice_number}`, 20, yPosition);
    yPosition += 6;
    doc.text(`Fecha de emisión: ${formatDate(data.issue_date)}`, 20, yPosition);
    yPosition += 6;
    doc.text(`Fecha de vencimiento: ${formatDate(data.due_date)}`, 20, yPosition);
    yPosition += 6;
    doc.text(`Estado: ${data.status.toUpperCase()}`, 20, yPosition);
    
    yPosition += 15;
    
    // From (User)
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('De:', 20, yPosition);
    yPosition += 7;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(data.user.name, 20, yPosition);
    yPosition += 6;
    doc.text(data.user.email, 20, yPosition);
    
    yPosition += 15;
    
    // To (Client)
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Para:', 20, yPosition);
    yPosition += 7;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(data.client.name, 20, yPosition);
    yPosition += 6;
    
    yPosition += 15;
    
    // Items table header
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Descripción', 20, yPosition);
    doc.text('Cant.', 120, yPosition);
    doc.text('Precio Unit.', 140, yPosition);
    doc.text('Total', 175, yPosition);
    
    yPosition += 2;
    doc.line(20, yPosition, 190, yPosition); // Horizontal line
    yPosition += 7;
    
    // Items
    doc.setFont('helvetica', 'normal');
    for (const item of data.items) {
      // Check if we need a new page
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.text(item.description, 20, yPosition);
      doc.text(item.quantity, 120, yPosition);
      doc.text(formatCurrency(item.unit_price, data.currency), 140, yPosition);
      doc.text(formatCurrency(item.total, data.currency), 175, yPosition);
      yPosition += 7;
    }
    
    yPosition += 5;
    doc.line(20, yPosition, 190, yPosition); // Horizontal line
    yPosition += 10;
    
    // Totals
    doc.setFont('helvetica', 'bold');
    doc.text('Subtotal:', 140, yPosition);
    doc.text(formatCurrency(data.subtotal, data.currency), 175, yPosition);
    yPosition += 7;
    
    doc.setFontSize(12);
    doc.text('TOTAL:', 140, yPosition);
    doc.text(formatCurrency(data.total, data.currency), 175, yPosition);
    
    yPosition += 15;
    
    // Notes
    if (data.notes) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Notas:', 20, yPosition);
      yPosition += 7;
      
      doc.setFont('helvetica', 'normal');
      const notesLines = doc.splitTextToSize(data.notes, 170);
      doc.text(notesLines, 20, yPosition);
      yPosition += notesLines.length * 6;
    }
    
    // Terms
    if (data.terms) {
      yPosition += 5;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Términos y condiciones:', 20, yPosition);
      yPosition += 7;
      
      doc.setFont('helvetica', 'normal');
      const termsLines = doc.splitTextToSize(data.terms, 170);
      doc.text(termsLines, 20, yPosition);
    }
    
    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(
        `Página ${i} de ${pageCount}`,
        doc.internal.pageSize.getWidth() / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    }
    
    // Generate base64
    const pdfBase64 = doc.output('datauristring').split(',')[1];
    
    console.log(`[PDF] PDF generated successfully for invoice: ${data.invoice_number}`);
    
    return pdfBase64;
  } catch (error: any) {
    console.error(`[PDF] Error generating PDF:`, error.message);
    throw new Error('Error al generar PDF');
  }
}

/**
 * Generate invoice PDF buffer (for download)
 */
export async function generateInvoicePDFBuffer(data: InvoiceData): Promise<Buffer> {
  const base64 = await generateInvoicePDF(data);
  return Buffer.from(base64, 'base64');
}
