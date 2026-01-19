#!/usr/bin/env node
/**
 * Script to apply invoice migration for paid_amount and balance fields
 */

import { createConnection } from 'mysql2/promise';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function applyMigration() {
  let connection;
  
  try {
    // Read database configuration from environment or use defaults
    const dbConfig = {
      host: process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT || '3306'),
      user: process.env.DATABASE_USER || 'root',
      password: process.env.DATABASE_PASSWORD || '',
      database: process.env.DATABASE_NAME || 'hiwork',
    };

    console.log('🔌 Connecting to database...');
    connection = await createConnection(dbConfig);
    console.log('✅ Connected successfully');

    // Read migration file
    const migrationPath = join(__dirname, 'migrations', 'add_paid_amount_balance_to_invoices.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');

    // Split by statement separator and filter out comments
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`📝 Applying migration: add_paid_amount_balance_to_invoices.sql`);
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log(`   Executing: ${statement.substring(0, 60)}...`);
        await connection.query(statement);
      }
    }

    console.log('✅ Migration applied successfully!');
    console.log('');
    console.log('📊 Summary:');
    console.log('   - Added `paid_amount` column to invoices table');
    console.log('   - Added `balance` column to invoices table');
    console.log('   - Updated existing invoices with correct balance values');
    
  } catch (error) {
    console.error('❌ Error applying migration:', error.message);
    
    // Check if columns already exist
    if (error.message.includes('Duplicate column name')) {
      console.log('ℹ️  Columns already exist. Migration may have been applied previously.');
    } else {
      process.exit(1);
    }
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

applyMigration();
