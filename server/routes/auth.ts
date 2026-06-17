// ============================================
// ROUTES: AUTH — Login, verify, me
// ============================================
import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../db';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// GET /api/v1/auth/users
router.get('/users', async (req: Request, res: Response) => {
  try {
    const result = await query(
      'SELECT nome, matricula FROM usuarios WHERE ativo = true ORDER BY nome'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Erro ao listar usuários públicos:', err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// POST /api/v1/auth/login
router.post('/login', async (req: Request, res: Response): Promise<any> => {
  try {
    const { matricula, pin } = req.body;
    if (!matricula) {
      return res.status(400).json({ error: 'Matrícula é obrigatória' });
    }

    const result = await query(
      'SELECT id, nome, matricula, pin_hash, papel, ativo FROM usuarios WHERE matricula = $1',
      [matricula.trim()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Usuário não encontrado' });
    }

    const user = result.rows[0];
    if (!user.ativo) {
      return res.status(401).json({ error: 'Usuário desativado' });
    }

    // Verify PIN if user has one set
    if (user.pin_hash) {
      if (!pin) {
        return res.status(401).json({ error: 'PIN é obrigatório' });
      }
      const pinValid = await bcrypt.compare(pin, user.pin_hash);
      if (!pinValid) {
        return res.status(401).json({ error: 'PIN incorreto' });
      }
    }

    const token = jwt.sign(
      { id: user.id, nome: user.nome, matricula: user.matricula, papel: user.papel },
      process.env.JWT_SECRET as string,
      { expiresIn: (process.env.JWT_EXPIRES_IN || '30d') as any }
    );

    res.json({
      token,
      user: {
        id: user.id,
        nome: user.nome,
        matricula: user.matricula,
        papel: user.papel
      }
    });
  } catch (err) {
    console.error('Erro no login:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/v1/auth/verify
router.post('/verify', authMiddleware, (req: Request, res: Response) => {
  res.json({ valid: true, user: req.user });
});

// GET /api/v1/auth/me
router.get('/me', authMiddleware, async (req: Request, res: Response): Promise<any> => {
  try {
    const result = await query(
      'SELECT id, nome, matricula, papel, ativo, criado_em FROM usuarios WHERE id = $1',
      [req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Erro ao buscar usuário:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// PUT /api/v1/auth/pin
router.put('/pin', authMiddleware, async (req: Request, res: Response): Promise<any> => {
  try {
    const { pinAtual, novoPin } = req.body;
    if (!novoPin || novoPin.length < 4) {
      return res.status(400).json({ error: 'O novo PIN deve ter pelo menos 4 dígitos' });
    }

    const result = await query('SELECT pin_hash FROM usuarios WHERE id = $1', [req.user.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Usuário não encontrado' });
    
    const user = result.rows[0];
    if (user.pin_hash) {
      const pinValid = await bcrypt.compare(pinAtual, user.pin_hash);
      if (!pinValid) return res.status(401).json({ error: 'PIN atual incorreto' });
    }

    const newPinHash = await bcrypt.hash(novoPin, 10);
    await query('UPDATE usuarios SET pin_hash = $1, atualizado_em = NOW() WHERE id = $2', [newPinHash, req.user.id]);
    
    res.json({ message: 'PIN atualizado com sucesso' });
  } catch (err) {
    console.error('Erro ao atualizar PIN:', err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

export default router;
