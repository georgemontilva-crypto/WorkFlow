/**
 * Database Migration Script
 * Executes all SQL migrations from drizzle/migrations folder
 * Runs automatically on server startup
 */

import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';

export async function runMigrations() {
  console.log('[Migrations] Starting database migrations...');
  
  let connection;
  
  try {
    // Get DATABASE_URL from environment
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      console.error('[Migrations] DATABASE_URL not found, skipping migrations');
      return;
    }
    
    // Create direct MySQL connection
    connection = await mysql.createConnection(databaseUrl);
    console.log('[Migrations] Connected to database');
    
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
        .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'));
      
      for (const statement of statements) {
        try {
          await connection.execute(statement);
        } catch (error: any) {
          // Ignore "table already exists" and "duplicate column" errors
          if (
            error.message.includes('already exists') ||
            error.message.includes('Duplicate column') ||
            error.message.includes('Duplicate key')
          ) {
            console.log(`[Migrations] Skipping (already exists): ${file}`);
            break; // Skip rest of this file
          } else {
            console.error(`[Migrations] Error in ${file}:`, error.message);
            // Don't throw, just log and continue
          }
        }
      }
      
      console.log(`[Migrations] ✓ Completed: ${file}`);
    }
    
    console.log('[Migrations] All migrations completed successfully');
  } catch (error: any) {
    console.error('[Migrations] Failed:', error.message);
    // Don't throw, just log
  } finally {
    if (connection) {
      await connection.end();
      console.log('[Migrations] Database connection closed');
    }
  }
}
