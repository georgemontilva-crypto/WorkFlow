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

interface CompanyProfileSnapshot {
  company_name: string;
  logo_url?: string | null;
  business_type?: string | null;
  email: string;
  phone?: string | null;
  website?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  country?: string | null;
  tax_id?: string | null;
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
 * Get business type label in Spanish
 */
function getBusinessTypeLabel(businessType?: string | null): string {
  if (!businessType) return '';
  
  const labels: Record<string, string> = {
    'freelancer': 'Freelancer',
    'empresa': 'Empresa',
    'agencia': 'Agencia'
  };
  
  return labels[businessType] || businessType;
}

/**
 * Get invoice status label in Spanish
 */
function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    'draft': 'Borrador',
    'sent': 'Enviada',
    'payment_sent': 'Pago Enviado',
    'paid': 'Pagada',
    'overdue': 'Vencida',
    'cancelled': 'Cancelada'
  };
  
  return labels[status] || status;
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
        margin: 50,
        bufferPages: true,
        size: 'LETTER'
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

      // Try to get company profile from snapshot first, then fallback to companyProfile
      let profile: CompanyProfileSnapshot | null = null;
      
      if (invoiceData.company_profile_snapshot) {
        try {
          profile = JSON.parse(invoiceData.company_profile_snapshot);
        } catch (error) {
          console.error('[PDF] Failed to parse company profile snapshot:', error);
        }
      }
      
      // Fallback to companyProfile if snapshot is not available
      if (!profile && invoiceData.companyProfile) {
        profile = invoiceData.companyProfile as CompanyProfileSnapshot;
      }

      // ==================== HEADER SECTION ====================
      const pageWidth = doc.page.width;
      const leftMargin = 50;
      const rightMargin = 50;
      const contentWidth = pageWidth - leftMargin - rightMargin;
      const middleX = leftMargin + (contentWidth / 2);
      
      let leftYPos = 50;
      let rightYPos = 50;

      // LEFT SIDE - Company Information (Emisor)
      if (profile) {
        // Company Name (Bold, larger)
        doc.fontSize(16).fillColor('#000').font('Helvetica-Bold');
        doc.text(profile.company_name, leftMargin, leftYPos, { width: contentWidth / 2 - 20 });
        leftYPos += 22;
        
        // Business Type (if available)
        if (profile.business_type) {
          doc.fontSize(9).fillColor('#666').font('Helvetica');
          doc.text(getBusinessTypeLabel(profile.business_type), leftMargin, leftYPos);
          leftYPos += 14;
        }
        
        // Country (if available)
        if (profile.country) {
          doc.fontSize(9).fillColor('#666').font('Helvetica');
          doc.text(profile.country, leftMargin, leftYPos);
          leftYPos += 14;
        }
        
        // Email
        if (profile.email) {
          doc.fontSize(9).fillColor('#666').font('Helvetica');
          doc.text(profile.email, leftMargin, leftYPos);
          leftYPos += 14;
        }
        
        // Phone (if available)
        if (profile.phone) {
          doc.fontSize(9).fillColor('#666').font('Helvetica');
          doc.text(profile.phone, leftMargin, leftYPos);
          leftYPos += 14;
        }
        
        // Tax ID (if available)
        if (profile.tax_id) {
          doc.fontSize(9).fillColor('#666').font('Helvetica');
          doc.text(`RIF/NIT: ${profile.tax_id}`, leftMargin, leftYPos);
          leftYPos += 14;
        }
      } else {
        // Default fallback if no profile
        doc.fontSize(16).fillColor('#000').font('Helvetica-Bold');
        doc.text('Finwrk', leftMargin, leftYPos);
        leftYPos += 20;
        doc.fontSize(9).fillColor('#666').font('Helvetica');
        doc.text('Sistema de Gestión Empresarial', leftMargin, leftYPos);
        leftYPos += 14;
      }

      // RIGHT SIDE - Invoice Information (Factura)
      const rightColumnX = middleX + 20;
      
      // Invoice Title
      doc.fontSize(18).fillColor('#000').font('Helvetica-Bold');
      doc.text('FACTURA', rightColumnX, rightYPos, { align: 'left' });
      rightYPos += 25;
      
      // Invoice Number
      doc.fontSize(9).fillColor('#666').font('Helvetica');
      doc.text('Número:', rightColumnX, rightYPos);
      doc.fontSize(9).fillColor('#000').font('Helvetica-Bold');
      doc.text(invoiceData.invoice_number, rightColumnX + 60, rightYPos);
      rightYPos += 14;
      
      // Issue Date
      doc.fontSize(9).fillColor('#666').font('Helvetica');
      doc.text('Fecha emisión:', rightColumnX, rightYPos);
      doc.fontSize(9).fillColor('#000').font('Helvetica');
      doc.text(new Date(invoiceData.issue_date).toLocaleDateString('es-ES'), rightColumnX + 60, rightYPos);
      rightYPos += 14;
      
      // Due Date
      doc.fontSize(9).fillColor('#666').font('Helvetica');
      doc.text('Vencimiento:', rightColumnX, rightYPos);
      doc.fontSize(9).fillColor('#000').font('Helvetica');
      doc.text(new Date(invoiceData.due_date).toLocaleDateString('es-ES'), rightColumnX + 60, rightYPos);
      rightYPos += 14;
      
      // Status
      doc.fontSize(9).fillColor('#666').font('Helvetica');
      doc.text('Estado:', rightColumnX, rightYPos);
      doc.fontSize(9).fillColor('#000').font('Helvetica-Bold');
      doc.text(getStatusLabel(invoiceData.status), rightColumnX + 60, rightYPos);
      rightYPos += 14;

      // Separator line after header
      const headerBottomY = Math.max(leftYPos, rightYPos) + 20;
      doc.moveTo(leftMargin, headerBottomY)
         .lineTo(pageWidth - rightMargin, headerBottomY)
         .strokeColor('#E5E7EB')
         .lineWidth(1)
         .stroke();

      // ==================== CLIENT SECTION ====================
      let clientYPos = headerBottomY + 30;
      
      doc.fontSize(11).fillColor('#000').font('Helvetica-Bold');
      doc.text('Facturar a:', leftMargin, clientYPos);
      clientYPos += 18;
      
      doc.fontSize(10).fillColor('#333').font('Helvetica');
      doc.text(invoiceData.clientName, leftMargin, clientYPos);
      clientYPos += 14;
      
      if (invoiceData.companyName) {
        doc.text(invoiceData.companyName, leftMargin, clientYPos);
        clientYPos += 14;
      }
      
      doc.text(invoiceData.clientEmail, leftMargin, clientYPos);
      clientYPos += 14;
      
      if (invoiceData.clientPhone) {
        doc.text(invoiceData.clientPhone, leftMargin, clientYPos);
        clientYPos += 14;
      }

      // ==================== ITEMS TABLE ====================
      const tableTop = clientYPos + 30;
      const tableHeaders = ['Descripción', 'Cantidad', 'Precio Unit.', 'Total'];
      const columnWidths = [280, 70, 90, 90];
      const columnPositions = [
        leftMargin,
        leftMargin + columnWidths[0],
        leftMargin + columnWidths[0] + columnWidths[1],
        leftMargin + columnWidths[0] + columnWidths[1] + columnWidths[2]
      ];
      
      // Table Header
      doc.fontSize(10).fillColor('#000').font('Helvetica-Bold');
      tableHeaders.forEach((header, i) => {
        const align = i === 0 ? 'left' : 'right';
        if (i === 0) {
          doc.text(header, columnPositions[i], tableTop);
        } else {
          doc.text(header, columnPositions[i], tableTop, { 
            width: columnWidths[i], 
            align: 'right' 
          });
        }
      });
      
      // Table Header Line
      doc.moveTo(leftMargin, tableTop + 15)
         .lineTo(pageWidth - rightMargin, tableTop + 15)
         .strokeColor('#E5E7EB')
         .lineWidth(1)
         .stroke();
      
      // Table Rows
      doc.font('Helvetica').fontSize(9).fillColor('#333');
      let yPosition = tableTop + 25;
      
      invoiceData.items.forEach((item) => {
        // Description (left aligned)
        doc.text(item.description, columnPositions[0], yPosition, { 
          width: columnWidths[0] - 10 
        });
        
        // Quantity (right aligned)
        doc.text(
          item.quantity.toString(), 
          columnPositions[1], 
          yPosition, 
          { width: columnWidths[1], align: 'right' }
        );
        
        // Unit Price (right aligned)
        doc.text(
          `$${item.unitPrice.toFixed(2)}`, 
          columnPositions[2], 
          yPosition, 
          { width: columnWidths[2], align: 'right' }
        );
        
        // Total (right aligned)
        doc.text(
          `$${item.total.toFixed(2)}`, 
          columnPositions[3], 
          yPosition, 
          { width: columnWidths[3], align: 'right' }
        );
        
        yPosition += 25;
      });
      
      // ==================== TOTALS SECTION ====================
      yPosition += 20;
      doc.moveTo(leftMargin, yPosition)
         .lineTo(pageWidth - rightMargin, yPosition)
         .strokeColor('#E5E7EB')
         .lineWidth(1)
         .stroke();
      yPosition += 15;
      
      const subtotal = parseFloat(invoiceData.subtotal);
      const tax = parseFloat(invoiceData.tax);
      const total = parseFloat(invoiceData.total);
      
      const totalsLabelX = pageWidth - rightMargin - 200;
      const totalsValueX = pageWidth - rightMargin - 90;
      
      // Subtotal
      doc.fontSize(10).fillColor('#666').font('Helvetica');
      doc.text('Subtotal:', totalsLabelX, yPosition);
      doc.text(`$${subtotal.toFixed(2)}`, totalsValueX, yPosition, { 
        width: 80, 
        align: 'right' 
      });
      
      yPosition += 20;
      
      // Tax
      doc.text('Impuestos:', totalsLabelX, yPosition);
      doc.text(`$${tax.toFixed(2)}`, totalsValueX, yPosition, { 
        width: 80, 
        align: 'right' 
      });
      
      yPosition += 25;
      
      // Total (Bold and larger)
      doc.fontSize(12).fillColor('#000').font('Helvetica-Bold');
      doc.text('TOTAL:', totalsLabelX, yPosition);
      doc.text(`$${total.toFixed(2)}`, totalsValueX, yPosition, { 
        width: 80, 
        align: 'right' 
      });
      
      // ==================== PAYMENT LINK ====================
      if (invoiceData.payment_link) {
        yPosition += 40;
        doc.fontSize(10).fillColor('#666').font('Helvetica-Bold');
        doc.text('Link de Pago:', leftMargin, yPosition);
        doc.fontSize(9).fillColor('#0066cc').font('Helvetica');
        doc.text(invoiceData.payment_link, leftMargin, yPosition + 15, {
          link: invoiceData.payment_link,
          underline: true,
          width: contentWidth
        });
      }
      
      // ==================== NOTES ====================
      if (invoiceData.notes) {
        yPosition += 60;
        doc.fontSize(10).fillColor('#666').font('Helvetica-Bold');
        doc.text('Notas:', leftMargin, yPosition);
        doc.fontSize(9).font('Helvetica').fillColor('#333');
        doc.text(invoiceData.notes, leftMargin, yPosition + 15, { 
          width: contentWidth 
        });
      }
      
      // ==================== FOOTER ====================
      doc.fontSize(8).fillColor('#999').font('Helvetica');
      const footerText = invoiceData.companyProfile?.invoice_footer || 'Gracias por su preferencia';
      doc.text(
        footerText,
        leftMargin,
        doc.page.height - 50,
        { align: 'center', width: contentWidth }
      );
      
      // Finalize PDF
      doc.end();
      
    } catch (error) {
      console.error('[PDF] Error generating invoice PDF:', error);
      reject(new Error('Failed to generate PDF'));
    }
  });
}
