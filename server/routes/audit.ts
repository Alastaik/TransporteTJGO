// ============================================
// ROUTES: AUDIT — Log de Auditoria
// ============================================
import express, { Request, Response } from 'express';
import { query } from '../db';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// GET /api/v1/audit/:checklistId — Listar histórico de um checklist
router.get('/:checklistId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { checklistId } = req.params;
    const result = await query(
      `SELECT id, usuario_id, usuario_nome, acao, detalhes, criado_em 
       FROM auditoria 
       WHERE checklist_id = $1 
       ORDER BY criado_em ASC`,
      [checklistId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Erro ao listar auditoria do checklist:', err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// GET /api/v1/audit — (Admin) Listar log geral paginado
router.get('/', authMiddleware, async (req: Request, res: Response): Promise<any> => {
  try {
    // Only admins can view the general audit log
    const user = (req as any).user;
    if (user.papel !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = (page - 1) * limit;

    const result = await query(
      `SELECT a.id, a.usuario_nome, a.checklist_id, a.acao, a.detalhes, a.criado_em,
              c.veiculo_placa, c.destino
       FROM auditoria a
       LEFT JOIN checklists c ON a.checklist_id = c.id
       ORDER BY a.criado_em DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    const countRes = await query('SELECT COUNT(*) as total FROM auditoria');
    const total = parseInt(countRes.rows[0].total);

    res.json({
      data: result.rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (err) {
    console.error('Erro ao listar auditoria geral:', err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

export default router;
