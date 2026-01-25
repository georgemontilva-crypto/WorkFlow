/**
 * Database Migration Script
 * Executes all SQL migrations from drizzle/migrations folder
 * Runs automatically on server startup
 */

import { getDb } from './db';
import fs from 'fs';
import path from 'path';

export async function runMigrations() {
  console.log('[Migrations] Starting database migrations...');
  
  try {
    const db = await getDb();
    const migrationsDir = path.join(process.cwd(), 'drizzle', 'migrations');
    
    // Check if migrations directory exists
    if (!fs.existsSync(migrationsDir)) {
      console.log('[Migrations] No migrations directory found, skipping...');
      return;
    }
    
    // Get all .sql files
    const files = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort(); // Execute in order
    
    console.log(`[Migrations] Found ${files.length} migration files`);
    
    for (const file of files) {
      console.log(`[Migrations] Executing: ${file}`);
      
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf-8');
      
      // Split by semicolon to handle multiple statements
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));
      
      for (const statement of statements) {
        try {
          await db.execute(statement);
        } catch (error: any) {
          // Ignore "table already exists" errors
          if (error.message.includes('already exists')) {
            console.log(`[Migrations] Skipping (already exists): ${file}`);
          } else {
            console.error(`[Migrations] Error in ${file}:`, error.message);
            throw error;
          }
        }
      }
      
      console.log(`[Migrations] ✓ Completed: ${file}`);
    }
    
    console.log('[Migrations] All migrations completed successfully');
  } catch (error: any) {
    console.error('[Migrations] Failed:', error.message);
    throw error;
  }
}
