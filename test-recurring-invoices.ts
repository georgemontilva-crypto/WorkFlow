/**
 * Script de Prueba - Facturas Recurrentes
 * Ejecuta el proceso de generación de facturas recurrentes manualmente
 */

import { processRecurringInvoices } from './server/_core/recurring-invoices-job';
import { db } from './server/db';

async function testRecurringInvoices() {
  console.log('='.repeat(60));
  console.log('PRUEBA DE FACTURAS RECURRENTES');
  console.log('='.repeat(60));
  console.log('');
  
  try {
    // 1. Mostrar facturas recurrentes existentes
    console.log('📋 Buscando facturas recurrentes...');
    const recurringInvoices = await db
      .select()
      .from(db.schema.invoices)
      .where(db.sql`is_recurring = true`);
    
    console.log(`✅ Encontradas ${recurringInvoices.length} facturas recurrentes:`);
    console.log('');
    
    for (const invoice of recurringInvoices) {
      console.log(`  • Factura #${invoice.invoice_number}`);
      console.log(`    - ID: ${invoice.id}`);
      console.log(`    - Usuario ID: ${invoice.user_id}`);
      console.log(`    - Frecuencia: ${invoice.recurrence_frequency}`);
      console.log(`    - Próxima generación: ${invoice.next_generation_date}`);
      console.log(`    - Total: ${invoice.currency} ${invoice.total}`);
      console.log('');
    }
    
    if (recurringInvoices.length === 0) {
      console.log('⚠️  No hay facturas recurrentes para procesar.');
      console.log('   Crea una factura recurrente desde la aplicación primero.');
      console.log('');
      return;
    }
    
    // 2. Contar facturas antes del proceso
    const invoicesBeforeCount = await db
      .select({ count: db.sql`count(*)` })
      .from(db.schema.invoices);
    
    console.log(`📊 Total de facturas antes: ${invoicesBeforeCount[0].count}`);
    console.log('');
    
    // 3. Ejecutar proceso de generación
    console.log('🔄 Ejecutando proceso de generación...');
    console.log('');
    await processRecurringInvoices();
    console.log('');
    
    // 4. Contar facturas después del proceso
    const invoicesAfterCount = await db
      .select({ count: db.sql`count(*)` })
      .from(db.schema.invoices);
    
    console.log(`📊 Total de facturas después: ${invoicesAfterCount[0].count}`);
    
    const generated = Number(invoicesAfterCount[0].count) - Number(invoicesBeforeCount[0].count);
    console.log(`✨ Facturas generadas: ${generated}`);
    console.log('');
    
    // 5. Mostrar facturas generadas
    if (generated > 0) {
      console.log('📄 Facturas generadas:');
      const generatedInvoices = await db
        .select()
        .from(db.schema.invoices)
        .where(db.sql`parent_invoice_id IS NOT NULL`)
        .orderBy(db.sql`created_at DESC`)
        .limit(generated);
      
      for (const invoice of generatedInvoices) {
        console.log(`  • Factura #${invoice.invoice_number}`);
        console.log(`    - ID: ${invoice.id}`);
        console.log(`    - Fecha de emisión: ${invoice.issue_date}`);
        console.log(`    - Fecha de vencimiento: ${invoice.due_date}`);
        console.log(`    - Total: ${invoice.currency} ${invoice.total}`);
        console.log(`    - Estado: ${invoice.status}`);
        console.log(`    - Generada desde: ${invoice.parent_invoice_id}`);
        console.log('');
      }
    }
    
    console.log('='.repeat(60));
    console.log('✅ PRUEBA COMPLETADA');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('❌ ERROR:', error);
    throw error;
  } finally {
    process.exit(0);
  }
}

// Ejecutar prueba
testRecurringInvoices();
