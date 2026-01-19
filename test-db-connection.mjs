import mysql from 'mysql2/promise';
import 'dotenv/config';

async function testConnection() {
  console.log('🔍 Testing MySQL connection...\n');
  
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL not found in environment variables');
    process.exit(1);
  }
  
  console.log('📝 Database URL:', databaseUrl.replace(/:[^:@]+@/, ':****@'));
  
  try {
    // Create connection
    const connection = await mysql.createConnection(databaseUrl);
    console.log('✅ Successfully connected to MySQL database\n');
    
    // Test query - show tables
    console.log('📊 Checking existing tables...');
    const [tables] = await connection.query('SHOW TABLES');
    
    if (tables.length === 0) {
      console.log('⚠️  No tables found in database');
      console.log('💡 Run "pnpm db:push" to create tables\n');
    } else {
      console.log(`✅ Found ${tables.length} tables:\n`);
      tables.forEach((table) => {
        const tableName = Object.values(table)[0];
        console.log(`   - ${tableName}`);
      });
      console.log('');
      
      // Check each table structure
      for (const table of tables) {
        const tableName = Object.values(table)[0];
        const [columns] = await connection.query(`DESCRIBE ${tableName}`);
        console.log(`\n📋 Table: ${tableName}`);
        console.log('   Columns:');
        columns.forEach((col) => {
          console.log(`   - ${col.Field} (${col.Type}) ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Key ? `[${col.Key}]` : ''}`);
        });
      }
    }
    
    await connection.end();
    console.log('\n✅ Connection test completed successfully');
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    if (error.code) {
      console.error('   Error code:', error.code);
    }
    process.exit(1);
  }
}

testConnection();
