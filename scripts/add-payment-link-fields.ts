/**
 * Migration Script: Add Payment Link and Proof Fields
 * Adds payment_link, payment_proof, and payment_proof_uploaded_at to invoices
 */

import mysql from "mysql2/promise";

const DATABASE_URL = process.env.DATABASE_URL || "mysql://root:LTctBojuWhrxYaLpkFHesSoFKiDfLwlf@crossover.proxy.rlwy.net:57415/railway";

async function addPaymentLinkFields() {
  console.log("🔄 Starting migration: Add payment link fields...");
  
  const pool = mysql.createPool({ uri: DATABASE_URL });

  try {
    // Check if columns already exist
    const [columns] = await pool.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'invoices'
      AND COLUMN_NAME IN ('payment_link', 'payment_proof', 'payment_proof_uploaded_at')
    `);

    const existingColumns = (columns as any[]).map(col => col.COLUMN_NAME);
    
    if (existingColumns.length === 3) {
      console.log("✓ All payment link fields already exist, skipping migration");
      return;
    }

    console.log("📋 Adding payment link fields to invoices table...");

    // Drop old Stripe/crypto columns if they exist
    try {
      await pool.query(`ALTER TABLE invoices DROP COLUMN payment_method`);
      console.log("✓ Removed payment_method column");
    } catch (e) {
      // Column doesn't exist, continue
    }

    try {
      await pool.query(`ALTER TABLE invoices DROP COLUMN stripe_payment_intent_id`);
      console.log("✓ Removed stripe_payment_intent_id column");
    } catch (e) {
      // Column doesn't exist, continue
    }

    try {
      await pool.query(`ALTER TABLE invoices DROP COLUMN crypto_payment_address`);
      console.log("✓ Removed crypto_payment_address column");
    } catch (e) {
      // Column doesn't exist, continue
    }

    // Add payment_link column
    if (!existingColumns.includes('payment_link')) {
      await pool.query(`
        ALTER TABLE invoices 
        ADD COLUMN payment_link TEXT AFTER payment_token
      `);
      console.log("✓ Added payment_link column");
    }

    // Add payment_proof column
    if (!existingColumns.includes('payment_proof')) {
      await pool.query(`
        ALTER TABLE invoices 
        ADD COLUMN payment_proof TEXT AFTER payment_link
      `);
      console.log("✓ Added payment_proof column");
    }

    // Add payment_proof_uploaded_at column
    if (!existingColumns.includes('payment_proof_uploaded_at')) {
      await pool.query(`
        ALTER TABLE invoices 
        ADD COLUMN payment_proof_uploaded_at TIMESTAMP NULL AFTER payment_proof
      `);
      console.log("✓ Added payment_proof_uploaded_at column");
    }

    // Add new status 'payment_sent' if not exists
    try {
      await pool.query(`
        ALTER TABLE invoices 
        MODIFY COLUMN status ENUM('draft', 'sent', 'payment_sent', 'paid', 'overdue', 'cancelled') NOT NULL DEFAULT 'draft'
      `);
      console.log("✓ Added 'payment_sent' status to enum");
    } catch (e) {
      console.log("⚠ Could not modify status enum (may already include payment_sent)");
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
addPaymentLinkFields()
  .then(() => {
    console.log("\n🎉 Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Migration failed:", error);
    process.exit(1);
  });
