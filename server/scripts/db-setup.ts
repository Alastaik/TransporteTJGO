// ============================================
// DB-SETUP.JS — Create tables from schema.sql
// Run: npm run db:setup
// ============================================
import dotenv from 'dotenv';
dotenv.config();

import fs from 'fs';
import path from 'path';
import { pool } from '../db';

async function setup() {
  console.log('🔧 Configurando banco de dados...\n');

  try {
    const schemaPath = path.join(__dirname, '..', 'db', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    await pool.query(schema);
    console.log('✅ Schema criado com sucesso!\n');

  } catch (err: any) {
    console.error('❌ Erro ao criar schema:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

setup();
