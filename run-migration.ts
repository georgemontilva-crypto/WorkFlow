/**
 * Run migration to add every_minute to recurrence_frequency enum
 */
import mysql from 'mysql2/promise';
import { ENV } from './server/_core/env';

async function runMigration() {
  console.log('🔄 Running migration: Add every_minute to recurrence_frequency enum');
  
  const connection = await mysql.createConnection(ENV.databaseUrl);
  
  try {
    console.log('✅ Connected to database');
    
    const sql = `
      ALTER TABLE invoices 
      MODIFY COLUMN recurrence_frequency 
      ENUM('every_minute', 'monthly', 'biweekly', 'annual', 'custom');
    `;
    
    console.log('📝 Executing SQL:', sql);
    await connection.execute(sql);
    
    console.log('✅ Migration completed successfully!');
    
  } catch (error: any) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    await connection.end();
    console.log('🔌 Database connection closed');
  }
}

runMigration()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
