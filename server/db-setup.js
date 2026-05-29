// ============================================
// DB-SETUP.JS — Create tables from schema.sql
// Run: npm run db:setup
// ============================================
require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { pool } = require('./db');

async function setup() {
  console.log('🔧 Configurando banco de dados...\n');

  try {
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    await pool.query(schema);
    console.log('✅ Schema criado com sucesso!\n');

  } catch (err) {
    console.error('❌ Erro ao criar schema:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

setup();
