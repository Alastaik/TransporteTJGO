// ============================================
// ROUTES: FOTOS — Upload / Download
// ============================================
import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { query } from '../db';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// Configure multer for Image upload
const storagePath = process.env.STORAGE_PATH ? path.join(process.env.STORAGE_PATH, '../fotos') : './server/storage/fotos';

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
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos de imagem são aceitos'));
    }
  }
});

// POST /api/v1/fotos/upload — Upload Foto
router.post('/upload', authMiddleware, upload.single('foto'), async (req: Request, res: Response): Promise<any> => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }

    const { checklist_id } = req.body;
    if (!checklist_id) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'checklist_id é obrigatório' });
    }

    // Usando a tabela que criamos: fotos_checklist (id, checklist_id, caminho_arquivo, criado_em)
    const result = await query(
      `INSERT INTO fotos_checklist (checklist_id, caminho_arquivo)
       VALUES ($1, $2) RETURNING *`,
      [
        checklist_id,
        path.join(storagePath, req.file.filename)
      ]
    );

    res.status(201).json({ message: 'Foto enviada com sucesso', data: result.rows[0] });
  } catch (err: any) {
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    console.error('Erro no upload da foto:', err);
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
});

// GET /api/v1/fotos/checklist/:checklist_id — Listar fotos de um checklist
router.get('/checklist/:checklist_id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { checklist_id } = req.params;
    const result = await query('SELECT * FROM fotos_checklist WHERE checklist_id = $1 ORDER BY criado_em DESC', [checklist_id]);
    res.json(result.rows);
  } catch (err) {
    console.error('Erro ao listar fotos:', err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// GET /api/v1/fotos/download/:id — Download/View Foto
router.get('/download/:id', async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const result = await query('SELECT * FROM fotos_checklist WHERE id = $1', [id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Foto não encontrada' });
    }

    const foto = result.rows[0];
    res.download(foto.caminho_arquivo);
  } catch (err) {
    console.error('Erro no download da foto:', err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// DELETE /api/v1/fotos/:id — Excluir Foto
router.delete('/:id', authMiddleware, async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const result = await query('SELECT * FROM fotos_checklist WHERE id = $1', [id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Foto não encontrada' });
    }

    const foto = result.rows[0];

    // Delete file
    if (fs.existsSync(foto.caminho_arquivo)) {
      fs.unlinkSync(foto.caminho_arquivo);
    }

    await query('DELETE FROM fotos_checklist WHERE id = $1', [id]);

    res.json({ message: 'Foto excluída com sucesso' });
  } catch (err) {
    console.error('Erro ao excluir foto:', err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

export default router;
