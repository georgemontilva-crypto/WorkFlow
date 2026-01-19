/**
 * Script de prueba de conexión a MySQL en Railway
 * 
 * Uso:
 *   node test-db-railway.mjs
 * 
 * Este script verifica:
 * 1. Conexión a la base de datos
 * 2. Listado de tablas existentes
 * 3. Estructura de las tablas principales
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ ERROR: DATABASE_URL no está configurada en las variables de entorno');
  console.log('\n📝 Asegúrate de tener un archivo .env con:');
  console.log('DATABASE_URL=mysql://root:password@host:port/database\n');
  process.exit(1);
}

async function testConnection() {
  let connection;
  
  try {
    console.log('🔄 Intentando conectar a la base de datos...');
    console.log(`📍 URL: ${DATABASE_URL.replace(/:[^:@]+@/, ':****@')}\n`);
    
    // Crear conexión
    connection = await mysql.createConnection(DATABASE_URL);
    
    console.log('✅ Conexión exitosa a MySQL!\n');
    
    // Obtener información del servidor
    const [serverInfo] = await connection.query('SELECT VERSION() as version');
    console.log(`📊 Versión de MySQL: ${serverInfo[0].version}`);
    
    // Obtener nombre de la base de datos
    const [dbInfo] = await connection.query('SELECT DATABASE() as db');
    console.log(`🗄️  Base de datos actual: ${dbInfo[0].db}\n`);
    
    // Listar todas las tablas
    console.log('📋 Listando tablas...');
    const [tables] = await connection.query('SHOW TABLES');
    
    if (tables.length === 0) {
      console.log('⚠️  No hay tablas en la base de datos');
      console.log('\n💡 Ejecuta las migraciones con: pnpm db:push\n');
    } else {
      console.log(`✅ Encontradas ${tables.length} tablas:\n`);
      
      for (const table of tables) {
        const tableName = Object.values(table)[0];
        console.log(`   📄 ${tableName}`);
        
        // Obtener estructura de la tabla
        const [columns] = await connection.query(`DESCRIBE ${tableName}`);
        console.log(`      Columnas: ${columns.length}`);
        
        // Contar registros
        const [count] = await connection.query(`SELECT COUNT(*) as count FROM ${tableName}`);
        console.log(`      Registros: ${count[0].count}\n`);
      }
    }
    
    // Verificar tablas esperadas del proyecto
    console.log('🔍 Verificando tablas del proyecto WorkFlow...');
    const expectedTables = [
      'user',
      'clients',
      'invoices',
      'transactions',
      'savings_goals',
      'support_tickets',
      'support_messages'
    ];
    
    const tableNames = tables.map(t => Object.values(t)[0]);
    const missingTables = expectedTables.filter(t => !tableNames.includes(t));
    
    if (missingTables.length === 0) {
      console.log('✅ Todas las tablas necesarias están presentes\n');
    } else {
      console.log('⚠️  Faltan las siguientes tablas:');
      missingTables.forEach(t => console.log(`   ❌ ${t}`));
      console.log('\n💡 Ejecuta las migraciones con: pnpm db:push\n');
    }
    
    console.log('✅ Prueba de conexión completada exitosamente!');
    
  } catch (error) {
    console.error('\n❌ ERROR al conectar a la base de datos:');
    console.error(`   ${error.message}\n`);
    
    if (error.code === 'ENOTFOUND') {
      console.log('💡 Posibles causas:');
      console.log('   - El host de la base de datos es incorrecto');
      console.log('   - No hay conexión a internet');
      console.log('   - El servicio MySQL no está corriendo\n');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('💡 Posibles causas:');
      console.log('   - Usuario o contraseña incorrectos');
      console.log('   - El usuario no tiene permisos\n');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('💡 Posibles causas:');
      console.log('   - El puerto es incorrecto');
      console.log('   - El servicio MySQL no está corriendo');
      console.log('   - Firewall bloqueando la conexión\n');
    }
    
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Ejecutar prueba
testConnection();
