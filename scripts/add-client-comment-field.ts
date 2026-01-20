import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { sql } from 'drizzle-orm';
import * as dotenv from 'dotenv';

dotenv.config();

const connection = await mysql.createConnection({
  uri: process.env.DATABASE_URL!,
});

const db = drizzle(connection);

async function addClientCommentField() {
  try {
    console.log('Adding client_comment field to invoices table...');
    
    // Add client_comment column
    await db.execute(sql`
      ALTER TABLE invoices 
      ADD COLUMN IF NOT EXISTS client_comment TEXT AFTER payment_proof_uploaded_at
    `);
    
    console.log('✅ client_comment field added successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding client_comment field:', error);
    process.exit(1);
  }
}

addClientCommentField();
