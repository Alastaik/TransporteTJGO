// ============================================
// DB-SEED.JS — Seed initial data (vistoriadores)
// Run: npm run db:seed
// ============================================
require('dotenv').config();

const bcrypt = require('bcryptjs');
const { pool, query } = require('./db');

const USUARIOS_INICIAIS = [
  { nome: 'FERNANDO LACERDA SILVA', matricula: '5055920', papel: 'admin' },
  { nome: 'VINICIUS TALES AZEVEDO COSTA', matricula: '02588', papel: 'vistoriador' },
  { nome: 'JORDANA FERNANDES RODRIGUES DE SOUSA', matricula: '02363', papel: 'vistoriador' }
];

async function seed() {
  console.log('🌱 Populando dados iniciais...\n');

  try {
    for (const user of USUARIOS_INICIAIS) {
      // Default PIN: 1234 (user should change later)
      const pinHash = await bcrypt.hash('1234', 10);

      const existing = await query('SELECT id FROM usuarios WHERE matricula = $1', [user.matricula]);
      if (existing.rows.length > 0) {
        console.log(`   ⏭  ${user.nome} (${user.matricula}) já existe, pulando...`);
        continue;
      }

      await query(
        'INSERT INTO usuarios (nome, matricula, pin_hash, papel) VALUES ($1, $2, $3, $4)',
        [user.nome, user.matricula, pinHash, user.papel]
      );
      console.log(`   ✅ ${user.nome} (${user.matricula}) — PIN padrão: 1234`);
    }

    console.log('\n✅ Seed concluído! Todos os usuários têm PIN padrão: 1234');
    console.log('   ⚠️  Altere os PINs após o primeiro login.\n');

  } catch (err) {
    console.error('❌ Erro no seed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seed();
