// ============================================
// SERVER.JS — Express Application Entry Point
// ============================================
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

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
app.use(express.static(path.join(__dirname, '..', 'public'), {
  maxAge: process.env.NODE_ENV === 'production' ? '1d' : 0,
  etag: true
}));

// ============ API ROUTES ============
const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const checklistsRoutes = require('./routes/checklists');
const pdfsRoutes = require('./routes/pdfs');

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', usersRoutes);
app.use('/api/v1/checklists', checklistsRoutes);
app.use('/api/v1/pdfs', pdfsRoutes);

// ============ HEALTH CHECK ============
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ============ SPA FALLBACK ============
// Any unmatched route serves index.html (SPA routing)
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api/')) {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
  } else {
    res.status(404).json({ error: 'Endpoint não encontrado' });
  }
});

// ============ ERROR HANDLER ============
app.use((err, req, res, next) => {
  console.error('Erro não tratado:', err);
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'Arquivo muito grande (máx 50MB)' });
  }
  res.status(500).json({ error: 'Erro interno do servidor' });
});

// ============ START ============
app.listen(PORT, '0.0.0.0', () => {
  console.log(`
  ╔════════════════════════════════════════════════╗
  ║   Sistema de Transporte TJGO — Servidor        ║
  ║   Rodando em http://0.0.0.0:${String(PORT).padEnd(5)}              ║
  ║   Ambiente: ${(process.env.NODE_ENV || 'development').padEnd(15)}              ║
  ╚════════════════════════════════════════════════╝
  `);
});

module.exports = app;
