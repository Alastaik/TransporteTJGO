// ============================================
// SERVER.TS — Express Application Entry Point
// ============================================
import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';

const app = express();
const PORT = process.env.PORT || 3000;

// ============ SECURITY ============
app.use(helmet({
  contentSecurityPolicy: false, // Allow inline scripts for PWA
  crossOriginEmbedderPolicy: false
}));
app.use(cors());

// ============ PARSING ============
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ============ STATIC FILES (Frontend) ============
app.use(express.static(path.join(__dirname, '..', '..', 'dist', 'client'), {
  maxAge: process.env.NODE_ENV === 'production' ? '1d' : 0,
  etag: true
}));

// ============ API ROUTES ============
import authRoutes from './routes/auth';
import usersRoutes from './routes/users';
import checklistsRoutes from './routes/checklists';
import pdfsRoutes from './routes/pdfs';
import auditRoutes from './routes/audit';
import fotosRoutes from './routes/fotos';

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', usersRoutes);
app.use('/api/v1/checklists', checklistsRoutes);
app.use('/api/v1/pdfs', pdfsRoutes);
app.use('/api/v1/audit', auditRoutes);
app.use('/api/v1/fotos', fotosRoutes);

// ============ HEALTH CHECK ============
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ============ SPA FALLBACK ============
// Any unmatched route serves index.html (SPA routing)
app.get('*', (req: Request, res: Response) => {
  if (!req.path.startsWith('/api/')) {
    res.sendFile(path.join(__dirname, '..', '..', 'dist', 'client', 'index.html'));
  } else {
    res.status(404).json({ error: 'Endpoint não encontrado' });
  }
});

// ============ ERROR HANDLER ============
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Erro não tratado:', err);
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'Arquivo muito grande (máx 50MB)' });
  }
  res.status(500).json({ error: 'Erro interno do servidor' });
});

// ============ START ============
app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`
  ╔════════════════════════════════════════════════╗
  ║   Sistema de Transporte TJGO — Servidor        ║
  ║   Rodando em http://0.0.0.0:${String(PORT).padEnd(5)}              ║
  ║   Ambiente: ${(process.env.NODE_ENV || 'development').padEnd(15)}              ║
  ╚════════════════════════════════════════════════╝
  `);
});

export default app;
