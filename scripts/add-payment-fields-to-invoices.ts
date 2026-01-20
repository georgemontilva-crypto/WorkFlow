/**
 * Migration Script: Add Payment Fields to Invoices
 * Adds payment_token, payment_method, stripe_payment_intent_id, and crypto_payment_address
 */

import mysql from "mysql2/promise";

const DATABASE_URL = process.env.DATABASE_URL || "mysql://root:LTctBojuWhrxYaLpkFHesSoFKiDfLwlf@crossover.proxy.rlwy.net:57415/railway";

async function addPaymentFieldsToInvoices() {
  console.log("🔄 Starting migration: Add payment fields to invoices...");
  
  const pool = mysql.createPool({ uri: DATABASE_URL });

  try {
    // Check if columns already exist
    const [columns] = await pool.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'invoices'
      AND COLUMN_NAME IN ('payment_token', 'payment_method', 'stripe_payment_intent_id', 'crypto_payment_address')
    `);

    const existingColumns = (columns as any[]).map(col => col.COLUMN_NAME);
    
    if (existingColumns.length === 4) {
      console.log("✓ All payment fields already exist, skipping migration");
      return;
    }

    console.log("📋 Adding payment fields to invoices table...");

    // Add payment_token column
    if (!existingColumns.includes('payment_token')) {
      await pool.query(`
        ALTER TABLE invoices 
        ADD COLUMN payment_token VARCHAR(64) UNIQUE AFTER status
      `);
      console.log("✓ Added payment_token column");
    }

    // Add payment_method column
    if (!existingColumns.includes('payment_method')) {
      await pool.query(`
        ALTER TABLE invoices 
        ADD COLUMN payment_method ENUM('stripe', 'crypto', 'manual', 'other') AFTER payment_token
      `);
      console.log("✓ Added payment_method column");
    }

    // Add stripe_payment_intent_id column
    if (!existingColumns.includes('stripe_payment_intent_id')) {
      await pool.query(`
        ALTER TABLE invoices 
        ADD COLUMN stripe_payment_intent_id VARCHAR(255) AFTER payment_method
      `);
      console.log("✓ Added stripe_payment_intent_id column");
    }

    // Add crypto_payment_address column
    if (!existingColumns.includes('crypto_payment_address')) {
      await pool.query(`
        ALTER TABLE invoices 
        ADD COLUMN crypto_payment_address VARCHAR(255) AFTER stripe_payment_intent_id
      `);
      console.log("✓ Added crypto_payment_address column");
    }

    // Generate payment tokens for existing invoices
    const [invoices] = await pool.query(`
      SELECT id FROM invoices WHERE payment_token IS NULL
    `);

    if ((invoices as any[]).length > 0) {
      console.log(`📋 Generating payment tokens for ${(invoices as any[]).length} existing invoices...`);
      
      for (const invoice of invoices as any[]) {
        const token = require('crypto').randomBytes(32).toString('hex');
        await pool.query(`
          UPDATE invoices SET payment_token = ? WHERE id = ?
        `, [token, invoice.id]);
      }
      
      console.log("✓ Payment tokens generated");
    }

    console.log("\n✅ Migration completed successfully!");

  } catch (error) {
    console.error("❌ Error during migration:", error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the migration
addPaymentFieldsToInvoices()
  .then(() => {
    console.log("\n🎉 Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Migration failed:", error);
    process.exit(1);
  });
