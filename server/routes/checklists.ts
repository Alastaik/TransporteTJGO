// ============================================
// ROUTES: CHECKLISTS — CRUD + filtros avançados
// ============================================
import express, { Request, Response } from 'express';
import { query, transaction } from '../db';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// GET /api/v1/checklists — Listar com filtros
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const queryParams: any = req.query;
    const status = queryParams.status;
    const tipo = queryParams.tipo;
    const placa = queryParams.placa;
    const destino = queryParams.destino;
    const motorista = queryParams.motorista;
    const vistoriador = queryParams.vistoriador;
    const data_inicio = queryParams.data_inicio;
    const data_fim = queryParams.data_fim;
    const busca = queryParams.busca;
    const page = queryParams.page || 1;
    const limit = queryParams.limit || 20;
    const ordem = queryParams.ordem || 'criado_em';
    const direcao = queryParams.direcao || 'DESC';

    const conditions = [];
    const values = [];
    let idx = 1;

    if (status) { conditions.push(`c.status = $${idx++}`); values.push(status); }
    if (tipo) { conditions.push(`c.tipo = $${idx++}`); values.push(tipo); }
    if (placa) { conditions.push(`UPPER(c.veiculo_placa) LIKE $${idx++}`); values.push(`%${placa.toUpperCase()}%`); }
    if (destino) { conditions.push(`UPPER(c.destino) LIKE $${idx++}`); values.push(`%${destino.toUpperCase()}%`); }
    if (motorista) { conditions.push(`UPPER(c.motorista_nome) LIKE $${idx++}`); values.push(`%${motorista.toUpperCase()}%`); }
    if (vistoriador) { conditions.push(`u.nome LIKE $${idx++}`); values.push(`%${vistoriador.toUpperCase()}%`); }
    if (data_inicio) { conditions.push(`c.entrada_data >= $${idx++}`); values.push(data_inicio); }
    if (data_fim) { conditions.push(`c.entrada_data <= $${idx++}`); values.push(data_fim); }
    if (busca) {
      conditions.push(`(
        UPPER(c.veiculo_placa) LIKE $${idx} OR
        UPPER(c.destino) LIKE $${idx} OR
        UPPER(c.motorista_nome) LIKE $${idx} OR
        UPPER(c.veiculo_modelo) LIKE $${idx} OR
        UPPER(u.nome) LIKE $${idx}
      )`);
      values.push(`%${busca.toUpperCase()}%`);
      idx++;
    }

    const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    // Validate ordem and direcao to prevent SQL injection
    const allowedOrdem = ['criado_em', 'entrada_data', 'veiculo_placa', 'destino', 'status'];
    const safeOrdem = allowedOrdem.includes(ordem) ? `c.${ordem}` : 'c.criado_em';
    const safeDirecao = direcao.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const offset = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);

    // Count total
    const countResult = await query(
      `SELECT COUNT(*) FROM checklists c LEFT JOIN usuarios u ON c.usuario_id = u.id ${where}`,
      values
    );
    const total = parseInt(countResult.rows[0].count);

    // Fetch page
    const dataResult = await query(
      `SELECT c.*, u.nome as vistoriador_nome, u.matricula as vistoriador_matricula
       FROM checklists c
       LEFT JOIN usuarios u ON c.usuario_id = u.id
       ${where}
       ORDER BY ${safeOrdem} ${safeDirecao}
       LIMIT $${idx++} OFFSET $${idx++}`,
      [...values, parseInt(limit), offset]
    );

    res.json({
      data: dataResult.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    console.error('Erro ao listar checklists:', err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// GET /api/v1/checklists/export — Exportar para CSV
router.get('/export', authMiddleware, async (req: Request, res: Response) => {
  try {
    const queryParams: any = req.query;
    const status = queryParams.status;
    const tipo = queryParams.tipo;
    const placa = queryParams.placa;
    const destino = queryParams.destino;
    const motorista = queryParams.motorista;
    const vistoriador = queryParams.vistoriador;
    const data_inicio = queryParams.data_inicio;
    const data_fim = queryParams.data_fim;
    const busca = queryParams.busca;

    const conditions = [];
    const values = [];
    let idx = 1;

    if (status) { conditions.push(`c.status = $${idx++}`); values.push(status); }
    if (tipo) { conditions.push(`c.tipo = $${idx++}`); values.push(tipo); }
    if (placa) { conditions.push(`UPPER(c.veiculo_placa) LIKE $${idx++}`); values.push(`%${placa.toUpperCase()}%`); }
    if (destino) { conditions.push(`UPPER(c.destino) LIKE $${idx++}`); values.push(`%${destino.toUpperCase()}%`); }
    if (motorista) { conditions.push(`UPPER(c.motorista_nome) LIKE $${idx++}`); values.push(`%${motorista.toUpperCase()}%`); }
    if (vistoriador) { conditions.push(`u.nome LIKE $${idx++}`); values.push(`%${vistoriador.toUpperCase()}%`); }
    if (data_inicio) { conditions.push(`c.entrada_data >= $${idx++}`); values.push(data_inicio); }
    if (data_fim) { conditions.push(`c.entrada_data <= $${idx++}`); values.push(data_fim); }
    if (busca) {
      conditions.push(`(
        UPPER(c.veiculo_placa) LIKE $${idx} OR
        UPPER(c.destino) LIKE $${idx} OR
        UPPER(c.motorista_nome) LIKE $${idx} OR
        UPPER(c.veiculo_modelo) LIKE $${idx} OR
        UPPER(u.nome) LIKE $${idx}
      )`);
      values.push(`%${busca.toUpperCase()}%`);
      idx++;
    }

    const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    const dataResult = await query(
      `SELECT c.id, c.status, c.tipo, c.veiculo_placa, c.veiculo_modelo, 
              c.destino, c.motorista_nome, u.nome as vistoriador_nome, 
              c.entrada_data, c.entrada_hora, c.entrada_km,
              c.saida_data, c.saida_hora, c.saida_km,
              c.criado_em
       FROM checklists c
       LEFT JOIN usuarios u ON c.usuario_id = u.id
       ${where}
       ORDER BY c.criado_em DESC`,
      values
    );

    // Build CSV
    const rows = dataResult.rows;
    let csv = 'ID;Status;Tipo;Placa;Modelo;Destino;Motorista;Vistoriador;Data Entrada;KM Entrada;Data Saida;KM Saida;Criado Em\n';
    
    rows.forEach(r => {
      const escape = (val: any) => val ? String(val).replace(/;/g, ',').replace(/\n/g, ' ') : '';
      const dateStr = (val: any) => val ? new Date(val).toLocaleDateString('pt-BR') : '';
      
      csv += `${r.id};${escape(r.status)};${escape(r.tipo)};${escape(r.veiculo_placa)};${escape(r.veiculo_modelo)};${escape(r.destino)};${escape(r.motorista_nome)};${escape(r.vistoriador_nome)};${dateStr(r.entrada_data)};${escape(r.entrada_km)};${dateStr(r.saida_data)};${escape(r.saida_km)};${dateStr(r.criado_em)}\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=relatorio_checklists.csv');
    res.send(csv);
  } catch (err) {
    console.error('Erro ao exportar checklists:', err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// GET /api/v1/checklists/stats — Estatísticas do dashboard
router.get('/stats', authMiddleware, async (req: Request, res: Response) => {
  try {
    const [emAndamento, concluidosHoje, concluidosMes, totalGeral] = await Promise.all([
      query(`SELECT COUNT(*) FROM checklists WHERE status = 'em_andamento'`),
      query(`SELECT COUNT(*) FROM checklists WHERE status = 'concluido' AND criado_em::date = CURRENT_DATE`),
      query(`SELECT COUNT(*) FROM checklists WHERE status = 'concluido' AND criado_em >= date_trunc('month', CURRENT_DATE)`),
      query(`SELECT COUNT(*) FROM checklists`)
    ]);

    // Most inspected vehicles (top 5)
    const topVeiculos = await query(
      `SELECT veiculo_placa, veiculo_modelo, COUNT(*) as total
       FROM checklists WHERE veiculo_placa IS NOT NULL AND veiculo_placa != ''
       GROUP BY veiculo_placa, veiculo_modelo ORDER BY total DESC LIMIT 5`
    );

    res.json({
      em_andamento: parseInt(emAndamento.rows[0].count),
      concluidos_hoje: parseInt(concluidosHoje.rows[0].count),
      concluidos_mes: parseInt(concluidosMes.rows[0].count),
      total_geral: parseInt(totalGeral.rows[0].count),
      top_veiculos: topVeiculos.rows
    });
  } catch (err) {
    console.error('Erro ao buscar stats:', err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// GET /api/v1/checklists/charts — Dados para gráficos do dashboard
router.get('/charts', authMiddleware, async (req: Request, res: Response) => {
  try {
    // Volume por mês (Últimos 6 meses)
    const volumeMeses = await query(
      `SELECT to_char(date_trunc('month', criado_em), 'MM/YYYY') AS mes, COUNT(*) AS total
       FROM checklists
       WHERE criado_em >= date_trunc('month', CURRENT_DATE) - INTERVAL '5 months'
       GROUP BY date_trunc('month', criado_em)
       ORDER BY date_trunc('month', criado_em) ASC`
    );

    // Distribuição por status (Geral)
    const statusDist = await query(
      `SELECT status, COUNT(*) AS total
       FROM checklists
       GROUP BY status`
    );

    res.json({
      volume: volumeMeses.rows,
      status: statusDist.rows
    });
  } catch (err) {
    console.error('Erro ao buscar dados dos gráficos:', err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// GET /api/v1/checklists/destinos — Lista de destinos únicos (para autocomplete)
router.get('/destinos', authMiddleware, async (req: Request, res: Response) => {
  try {
    const result = await query(
      `SELECT DISTINCT destino FROM checklists 
       WHERE destino IS NOT NULL AND destino != '' 
       ORDER BY destino LIMIT 100`
    );
    res.json(result.rows.map(r => r.destino));
  } catch (err) {
    res.status(500).json({ error: 'Erro interno' });
  }
});

// GET /api/v1/checklists/:id — Detalhes de um checklist
router.get('/:id', authMiddleware, async (req: Request, res: Response): Promise<any> => {
  try {
    const result = await query(
      `SELECT c.*, u.nome as vistoriador_nome, u.matricula as vistoriador_matricula
       FROM checklists c
       LEFT JOIN usuarios u ON c.usuario_id = u.id
       WHERE c.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Checklist não encontrado' });
    }

    // Fetch associated photos
    const fotos = await query(
      'SELECT id, categoria, label, dados FROM fotos WHERE checklist_id = $1 ORDER BY id',
      [req.params.id]
    );

    // Fetch associated PDFs
    const pdfs = await query(
      'SELECT id, nome_arquivo, tipo_veiculo, tamanho_bytes, criado_em FROM pdfs WHERE checklist_id = $1 ORDER BY criado_em DESC',
      [req.params.id]
    );

    const checklist = result.rows[0];
    checklist.fotos = fotos.rows;
    checklist.pdfs = pdfs.rows;

    res.json(checklist);
  } catch (err) {
    console.error('Erro ao buscar checklist:', err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// POST /api/v1/checklists — Criar novo checklist
router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const data = req.body;
    const result = await query(
      `INSERT INTO checklists (
        uuid, status, tipo, usuario_id,
        veiculo_placa, veiculo_modelo, veiculo_marca, veiculo_ano,
        veiculo_motor, veiculo_cor, veiculo_placa_descaract,
        emp_placa, emp_modelo, emp_marca, emp_ano,
        emp_motor, emp_cor, emp_placa_descaract,
        unidade, destino, objetivo,
        motorista_nome, motorista_cnh,
        entrada_data, entrada_hora, entrada_combustivel, entrada_km,
        entrada_checklist, entrada_outros_defeitos, entrada_obs,
        entrada_servicos, entrada_assinatura, entrada_assinatura_vistoriador,
        emp_entrada_data, emp_entrada_hora, emp_entrada_combustivel, emp_entrada_km,
        emp_entrada_checklist, emp_entrada_outros_defeitos, emp_entrada_obs,
        emp_entrada_servicos, emp_entrada_assinatura, emp_entrada_assinatura_vistoriador,
        saida_data, saida_hora, saida_combustivel, saida_km,
        saida_checklist, saida_outros_defeitos, saida_obs,
        saida_servicos, saida_assinatura, saida_assinatura_vistoriador,
        emp_saida_data, emp_saida_hora, emp_saida_combustivel, emp_saida_km,
        emp_saida_checklist, emp_saida_outros_defeitos, emp_saida_obs,
        emp_saida_servicos, emp_saida_assinatura, emp_saida_assinatura_vistoriador
      ) VALUES (
        COALESCE($1, gen_random_uuid()), $2, $3, $4,
        $5, $6, $7, $8, $9, $10, $11,
        $12, $13, $14, $15, $16, $17, $18,
        $19, $20, $21,
        $22, $23,
        $24, $25, $26, $27,
        $28, $29, $30, $31, $32, $33,
        $34, $35, $36, $37,
        $38, $39, $40, $41, $42, $43,
        $44, $45, $46, $47,
        $48, $49, $50, $51, $52, $53,
        $54, $55, $56, $57,
        $58, $59, $60, $61, $62, $63
      ) RETURNING *`,
      [
        data.uuid || null,
        data.status || 'em_andamento',
        data.tipo || 'simples',
        (req as any).user.id,
        data.veiculo_placa, data.veiculo_modelo, data.veiculo_marca, data.veiculo_ano,
        data.veiculo_motor, data.veiculo_cor, data.veiculo_placa_descaract,
        data.emp_placa, data.emp_modelo, data.emp_marca, data.emp_ano,
        data.emp_motor, data.emp_cor, data.emp_placa_descaract,
        data.unidade, data.destino, data.objetivo,
        data.motorista_nome, data.motorista_cnh,
        data.entrada_data || null, data.entrada_hora || null,
        data.entrada_combustivel, data.entrada_km,
        data.entrada_checklist ? JSON.stringify(data.entrada_checklist) : null,
        data.entrada_outros_defeitos, data.entrada_obs,
        data.entrada_servicos, data.entrada_assinatura, data.entrada_assinatura_vistoriador,
        data.emp_entrada_data || null, data.emp_entrada_hora || null,
        data.emp_entrada_combustivel, data.emp_entrada_km,
        data.emp_entrada_checklist ? JSON.stringify(data.emp_entrada_checklist) : null,
        data.emp_entrada_outros_defeitos, data.emp_entrada_obs,
        data.emp_entrada_servicos, data.emp_entrada_assinatura, data.emp_entrada_assinatura_vistoriador,
        data.saida_data || null, data.saida_hora || null,
        data.saida_combustivel, data.saida_km,
        data.saida_checklist ? JSON.stringify(data.saida_checklist) : null,
        data.saida_outros_defeitos, data.saida_obs,
        data.saida_servicos, data.saida_assinatura, data.saida_assinatura_vistoriador,
        data.emp_saida_data || null, data.emp_saida_hora || null,
        data.emp_saida_combustivel, data.emp_saida_km,
        data.emp_saida_checklist ? JSON.stringify(data.emp_saida_checklist) : null,
        data.emp_saida_outros_defeitos, data.emp_saida_obs,
        data.emp_saida_servicos, data.emp_saida_assinatura, data.emp_saida_assinatura_vistoriador
      ]
    );
    const newChecklist = result.rows[0];
    const user = (req as any).user;
    if (user) {
      await query(
        `INSERT INTO auditoria (usuario_id, usuario_nome, checklist_id, acao, detalhes) VALUES ($1, $2, $3, $4, $5)`,
        [user.id, user.nome, newChecklist.id, 'criou', `Checklist criado (Placa: ${data.veiculo_placa || 'N/A'})`]
      );
    }

    res.status(201).json(newChecklist);
  } catch (err) {
    console.error('Erro ao criar checklist:', err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// PUT /api/v1/checklists/:id — Atualizar (incluindo concluir saída)
router.put('/:id', authMiddleware, async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const data = req.body;

    // Build dynamic update
    const fields = [];
    const values = [];
    let idx = 1;

    const allowedFields = [
      'status', 'tipo',
      'veiculo_placa', 'veiculo_modelo', 'veiculo_marca', 'veiculo_ano',
      'veiculo_motor', 'veiculo_cor', 'veiculo_placa_descaract',
      'emp_placa', 'emp_modelo', 'emp_marca', 'emp_ano',
      'emp_motor', 'emp_cor', 'emp_placa_descaract',
      'unidade', 'destino', 'objetivo',
      'motorista_nome', 'motorista_cnh',
      'entrada_data', 'entrada_hora', 'entrada_combustivel', 'entrada_km',
      'entrada_outros_defeitos', 'entrada_obs', 'entrada_servicos', 'entrada_assinatura', 'entrada_assinatura_vistoriador',
      'saida_data', 'saida_hora', 'saida_combustivel', 'saida_km',
      'saida_outros_defeitos', 'saida_obs', 'saida_servicos', 'saida_assinatura', 'saida_assinatura_vistoriador',
      'emp_entrada_data', 'emp_entrada_hora', 'emp_entrada_combustivel', 'emp_entrada_km',
      'emp_entrada_outros_defeitos', 'emp_entrada_obs', 'emp_entrada_servicos', 'emp_entrada_assinatura', 'emp_entrada_assinatura_vistoriador',
      'emp_saida_data', 'emp_saida_hora', 'emp_saida_combustivel', 'emp_saida_km',
      'emp_saida_outros_defeitos', 'emp_saida_obs', 'emp_saida_servicos', 'emp_saida_assinatura', 'emp_saida_assinatura_vistoriador'
    ];

    const jsonFields = [
      'entrada_checklist', 'saida_checklist',
      'emp_entrada_checklist', 'emp_saida_checklist'
    ];

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        fields.push(`${field} = $${idx++}`);
        values.push(data[field]);
      }
    }

    for (const field of jsonFields) {
      if (data[field] !== undefined) {
        fields.push(`${field} = $${idx++}`);
        values.push(JSON.stringify(data[field]));
      }
    }

    if (fields.length === 0) {
      return res.status(400).json({ error: 'Nenhum campo para atualizar' });
    }

    fields.push('atualizado_em = NOW()');
    values.push(id);

    const result = await query(
      `UPDATE checklists SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Checklist não encontrado' });
    }

    const updatedChecklist = result.rows[0];
    const user = (req as any).user;
    if (user) {
      let acao = 'editou';
      let detalhes = 'Checklist atualizado';
      if (data.status === 'concluido') {
        acao = 'concluiu';
        detalhes = 'Checklist concluído';
      } else if (data.saida_km || data.emp_saida_km) {
        acao = 'editou_saida';
        detalhes = 'Registro de saída atualizado';
      } else if (data.entrada_km || data.emp_entrada_km) {
        acao = 'editou_entrada';
        detalhes = 'Registro de entrada atualizado';
      }

      await query(
        `INSERT INTO auditoria (usuario_id, usuario_nome, checklist_id, acao, detalhes) VALUES ($1, $2, $3, $4, $5)`,
        [user.id, user.nome, updatedChecklist.id, acao, detalhes]
      );
    }

    res.json(updatedChecklist);
  } catch (err) {
    console.error('Erro ao atualizar checklist:', err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// DELETE /api/v1/checklists/:id
router.delete('/:id', authMiddleware, async (req: Request, res: Response): Promise<any> => {
  try {
    const result = await query('DELETE FROM checklists WHERE id = $1 RETURNING id, veiculo_placa', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Checklist não encontrado' });
    }

    const deleted = result.rows[0];
    const user = (req as any).user;
    if (user) {
      await query(
        `INSERT INTO auditoria (usuario_id, usuario_nome, checklist_id, acao, detalhes) VALUES ($1, $2, NULL, $3, $4)`,
        [user.id, user.nome, 'deletou', `Checklist #${deleted.id} removido (Placa: ${deleted.veiculo_placa || 'N/A'})`]
      );
    }

    res.json({ message: 'Checklist removido', id: deleted.id });
  } catch (err) {
    console.error('Erro ao deletar checklist:', err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// POST /api/v1/checklists/:id/fotos — Salvar fotos de um checklist
router.post('/:id/fotos', authMiddleware, async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const { fotos } = req.body; // Array of { categoria, label, dados }
    const { fase } = req.query; // 'entrada', 'saida', or undefined

    if (!Array.isArray(fotos) || fotos.length === 0) {
      return res.status(400).json({ error: 'Nenhuma foto enviada' });
    }

    if (fase === 'unico' || !fase) {
      // Delete all existing photos for this checklist
      await query('DELETE FROM fotos WHERE checklist_id = $1', [id]);
    } else {
      // Delete only the photos for the current phase (entrada_... or saida_...)
      await query('DELETE FROM fotos WHERE checklist_id = $1 AND categoria LIKE $2', [id, fase + '_%']);
    }

    const insertPromises = fotos.map(foto =>
      query(
        'INSERT INTO fotos (checklist_id, categoria, label, dados) VALUES ($1, $2, $3, $4)',
        [id, foto.categoria, foto.label, foto.dados]
      )
    );

    await Promise.all(insertPromises);
    res.json({ message: 'Fotos salvas', count: fotos.length });
  } catch (err) {
    console.error('Erro ao salvar fotos:', err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

export default router;
