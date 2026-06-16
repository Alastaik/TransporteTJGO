// ============================================
// ROUTES: PDFs — Upload / Download
// ============================================
import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { query } from '../db';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// Configure multer for PDF upload
const storagePath = process.env.STORAGE_PATH || './server/storage/pdfs';

// Ensure storage directory exists
if (!fs.existsSync(storagePath)) {
  fs.mkdirSync(storagePath, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, storagePath),
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}_${file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos PDF são aceitos'));
    }
  }
});

// POST /api/v1/pdfs/upload — Upload PDF
router.post('/upload', authMiddleware, upload.single('pdf'), async (req: Request, res: Response): Promise<any> => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }

    const { checklist_id, tipo_veiculo } = req.body;
    if (!checklist_id) {
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'checklist_id é obrigatório' });
    }

    const result = await query(
      `INSERT INTO pdfs (checklist_id, nome_arquivo, caminho, tamanho_bytes, tipo_veiculo)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [
        checklist_id,
        req.file.originalname,
        req.file.path,
        req.file.size,
        tipo_veiculo || 'vistoria'
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Erro ao salvar PDF:', err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// GET /api/v1/pdfs/:id/download — Download PDF
router.get('/:id/download', authMiddleware, async (req: Request, res: Response): Promise<any> => {
  try {
    const result = await query('SELECT * FROM pdfs WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'PDF não encontrado' });
    }

    const pdf = result.rows[0];
    if (!fs.existsSync(pdf.caminho)) {
      return res.status(404).json({ error: 'Arquivo PDF não encontrado no disco' });
    }

    res.download(pdf.caminho, pdf.nome_arquivo);
  } catch (err) {
    console.error('Erro ao baixar PDF:', err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// GET /api/v1/pdfs/checklist/:checklistId — Listar PDFs de um checklist
router.get('/checklist/:checklistId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const result = await query(
      'SELECT id, nome_arquivo, tipo_veiculo, tamanho_bytes, criado_em FROM pdfs WHERE checklist_id = $1 ORDER BY criado_em DESC',
      [req.params.checklistId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Erro ao listar PDFs:', err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// DELETE /api/v1/pdfs/:id — Deletar PDF
router.delete('/:id', authMiddleware, async (req: Request, res: Response): Promise<any> => {
  try {
    const result = await query('SELECT caminho FROM pdfs WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'PDF não encontrado' });
    }

    // Delete file from disk
    const filePath = result.rows[0].caminho;
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await query('DELETE FROM pdfs WHERE id = $1', [req.params.id]);
    res.json({ message: 'PDF removido' });
  } catch (err) {
    console.error('Erro ao deletar PDF:', err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

export default router;
