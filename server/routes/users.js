// ============================================
// ROUTES: USERS — CRUD de usuários
// ============================================
const express = require('express');
const bcrypt = require('bcryptjs');
const { query } = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// GET /api/v1/users — Listar todos os usuários
router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await query(
      'SELECT id, nome, matricula, papel, ativo, criado_em FROM usuarios ORDER BY nome'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Erro ao listar usuários:', err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// POST /api/v1/users — Criar novo usuário
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { nome, matricula, pin, papel } = req.body;
    if (!nome || !matricula) {
      return res.status(400).json({ error: 'Nome e matrícula são obrigatórios' });
    }

    // Check if matricula already exists
    const existing = await query('SELECT id FROM usuarios WHERE matricula = $1', [matricula]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Matrícula já cadastrada' });
    }

    let pinHash = null;
    if (pin) {
      pinHash = await bcrypt.hash(pin, 10);
    }

    const result = await query(
      `INSERT INTO usuarios (nome, matricula, pin_hash, papel) 
       VALUES ($1, $2, $3, $4) RETURNING id, nome, matricula, papel, ativo, criado_em`,
      [nome.toUpperCase(), matricula.trim(), pinHash, papel || 'vistoriador']
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Erro ao criar usuário:', err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// PUT /api/v1/users/:id — Atualizar usuário
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, matricula, pin, papel, ativo } = req.body;

    const fields = [];
    const values = [];
    let idx = 1;

    if (nome !== undefined) { fields.push(`nome = $${idx++}`); values.push(nome.toUpperCase()); }
    if (matricula !== undefined) { fields.push(`matricula = $${idx++}`); values.push(matricula.trim()); }
    if (papel !== undefined) { fields.push(`papel = $${idx++}`); values.push(papel); }
    if (ativo !== undefined) { fields.push(`ativo = $${idx++}`); values.push(ativo); }
    if (pin !== undefined) {
      const pinHash = pin ? await bcrypt.hash(pin, 10) : null;
      fields.push(`pin_hash = $${idx++}`);
      values.push(pinHash);
    }

    if (fields.length === 0) {
      return res.status(400).json({ error: 'Nenhum campo para atualizar' });
    }

    fields.push(`atualizado_em = NOW()`);
    values.push(id);

    const result = await query(
      `UPDATE usuarios SET ${fields.join(', ')} WHERE id = $${idx} 
       RETURNING id, nome, matricula, papel, ativo`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Erro ao atualizar usuário:', err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

module.exports = router;
