import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';

const DATABASE_URL = 'mysql://root:LTctBojuWhrxYaLpkFHesSoFKiDfLwlf@crossover.proxy.rlwy.net:57415/railway';

async function checkTablesStructure() {
  const connection = await mysql.createConnection(DATABASE_URL);
  const db = drizzle(connection);

  console.log('🔍 Checking database structure...\n');

  try {
    // Get all tables
    const [tables] = await connection.query('SHOW TABLES');
    console.log(`✅ Found ${tables.length} tables:\n`);
    
    for (const table of tables) {
      const tableName = Object.values(table)[0];
      console.log(`\n📋 Table: ${tableName}`);
      console.log('─'.repeat(60));
      
      // Get table structure
      const [columns] = await connection.query(`DESCRIBE ${tableName}`);
      console.log('Columns:');
      columns.forEach(col => {
        console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Key ? `[${col.Key}]` : ''} ${col.Default !== null ? `DEFAULT ${col.Default}` : ''}`);
      });
      
      // Get row count
      const [count] = await connection.query(`SELECT COUNT(*) as count FROM ${tableName}`);
      console.log(`\nRows: ${count[0].count}`);
      
      // Get indexes
      const [indexes] = await connection.query(`SHOW INDEXES FROM ${tableName}`);
      if (indexes.length > 0) {
        console.log('\nIndexes:');
        const uniqueIndexes = [...new Set(indexes.map(idx => idx.Key_name))];
        uniqueIndexes.forEach(indexName => {
          const indexCols = indexes.filter(idx => idx.Key_name === indexName);
          const cols = indexCols.map(idx => idx.Column_name).join(', ');
          const unique = indexCols[0].Non_unique === 0 ? 'UNIQUE' : '';
          console.log(`  - ${indexName}: (${cols}) ${unique}`);
        });
      }
    }
    
    console.log('\n\n🎯 Summary:');
    console.log('─'.repeat(60));
    console.log(`Total tables: ${tables.length}`);
    
    const expectedTables = [
      'user',
      'clients', 
      'invoices',
      'invoice_items',
      'transactions',
      'savings_goals',
      'support_tickets',
      'support_messages'
    ];
    
    const actualTables = tables.map(t => Object.values(t)[0]);
    const missingTables = expectedTables.filter(t => !actualTables.includes(t));
    
    if (missingTables.length > 0) {
      console.log('\n❌ Missing tables:');
      missingTables.forEach(t => console.log(`  - ${t}`));
    } else {
      console.log('\n✅ All expected tables exist!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

checkTablesStructure();
