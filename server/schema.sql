-- ============================================
-- Sistema de Transporte TJGO — Schema PostgreSQL
-- Execute: psql -U tjgo_app -d transporte_tjgo -f schema.sql
-- ============================================

-- Extensão para UUIDs
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- TABELA: usuarios
-- ============================================
CREATE TABLE IF NOT EXISTS usuarios (
  id          SERIAL PRIMARY KEY,
  nome        VARCHAR(255) NOT NULL,
  matricula   VARCHAR(50) UNIQUE NOT NULL,
  pin_hash    VARCHAR(255),
  papel       VARCHAR(20) DEFAULT 'vistoriador',
  ativo       BOOLEAN DEFAULT TRUE,
  criado_em   TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABELA: checklists
-- ============================================
CREATE TABLE IF NOT EXISTS checklists (
  id                      SERIAL PRIMARY KEY,
  uuid                    UUID DEFAULT gen_random_uuid() UNIQUE,
  status                  VARCHAR(20) NOT NULL DEFAULT 'em_andamento'
                          CHECK (status IN ('em_andamento', 'concluido')),
  tipo                    VARCHAR(20) NOT NULL DEFAULT 'simples'
                          CHECK (tipo IN ('simples', 'troca')),
  usuario_id              INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,

  -- Veículo principal
  veiculo_placa           VARCHAR(20),
  veiculo_modelo          VARCHAR(100),
  veiculo_marca           VARCHAR(100),
  veiculo_ano             VARCHAR(20),
  veiculo_motor           VARCHAR(50),
  veiculo_cor             VARCHAR(50),
  veiculo_placa_descaract VARCHAR(50),

  -- Veículo empréstimo (modo troca)
  emp_placa               VARCHAR(20),
  emp_modelo              VARCHAR(100),
  emp_marca               VARCHAR(100),
  emp_ano                 VARCHAR(20),
  emp_motor               VARCHAR(50),
  emp_cor                 VARCHAR(50),
  emp_placa_descaract     VARCHAR(50),

  -- Dados da viagem
  unidade                 TEXT,
  destino                 TEXT,
  objetivo                TEXT,

  -- Condutor / Motorista
  motorista_nome          VARCHAR(255),
  motorista_cnh           VARCHAR(50),

  -- ========== ENTRADA (Veículo Oficial) ==========
  entrada_data            DATE,
  entrada_hora            TIME,
  entrada_combustivel     VARCHAR(20),
  entrada_km              VARCHAR(20),
  entrada_checklist       JSONB DEFAULT '[]',
  entrada_outros_defeitos TEXT,
  entrada_obs             TEXT,
  entrada_servicos        TEXT,
  entrada_assinatura      TEXT,

  -- ========== SAÍDA (Veículo Oficial) ==========
  saida_data              DATE,
  saida_hora              TIME,
  saida_combustivel       VARCHAR(20),
  saida_km                VARCHAR(20),
  saida_checklist         JSONB DEFAULT '[]',
  saida_outros_defeitos   TEXT,
  saida_obs               TEXT,
  saida_servicos          TEXT,
  saida_assinatura        TEXT,

  -- ========== EMPRÉSTIMO ENTRADA ==========
  emp_entrada_data            DATE,
  emp_entrada_hora            TIME,
  emp_entrada_combustivel     VARCHAR(20),
  emp_entrada_km              VARCHAR(20),
  emp_entrada_checklist       JSONB DEFAULT '[]',
  emp_entrada_outros_defeitos TEXT,
  emp_entrada_obs             TEXT,
  emp_entrada_servicos        TEXT,
  emp_entrada_assinatura      TEXT,

  -- ========== EMPRÉSTIMO SAÍDA ==========
  emp_saida_data              DATE,
  emp_saida_hora              TIME,
  emp_saida_combustivel       VARCHAR(20),
  emp_saida_km                VARCHAR(20),
  emp_saida_checklist         JSONB DEFAULT '[]',
  emp_saida_outros_defeitos   TEXT,
  emp_saida_obs               TEXT,
  emp_saida_servicos          TEXT,
  emp_saida_assinatura        TEXT,

  -- Metadados
  criado_em               TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em           TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABELA: pdfs
-- ============================================
CREATE TABLE IF NOT EXISTS pdfs (
  id              SERIAL PRIMARY KEY,
  checklist_id    INTEGER REFERENCES checklists(id) ON DELETE CASCADE,
  nome_arquivo    VARCHAR(255) NOT NULL,
  caminho         VARCHAR(500) NOT NULL,
  tamanho_bytes   BIGINT DEFAULT 0,
  tipo_veiculo    VARCHAR(20) DEFAULT 'vistoria',
  criado_em       TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABELA: fotos
-- ============================================
CREATE TABLE IF NOT EXISTS fotos (
  id              SERIAL PRIMARY KEY,
  checklist_id    INTEGER REFERENCES checklists(id) ON DELETE CASCADE,
  categoria       VARCHAR(50) NOT NULL,
  label           VARCHAR(100),
  dados           TEXT,
  criado_em       TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ÍNDICES para performance nos filtros
-- ============================================
CREATE INDEX IF NOT EXISTS idx_checklists_status ON checklists(status);
CREATE INDEX IF NOT EXISTS idx_checklists_placa ON checklists(veiculo_placa);
CREATE INDEX IF NOT EXISTS idx_checklists_destino ON checklists(destino);
CREATE INDEX IF NOT EXISTS idx_checklists_motorista ON checklists(motorista_nome);
CREATE INDEX IF NOT EXISTS idx_checklists_usuario ON checklists(usuario_id);
CREATE INDEX IF NOT EXISTS idx_checklists_entrada_data ON checklists(entrada_data);
CREATE INDEX IF NOT EXISTS idx_checklists_criado ON checklists(criado_em DESC);
CREATE INDEX IF NOT EXISTS idx_pdfs_checklist ON pdfs(checklist_id);
CREATE INDEX IF NOT EXISTS idx_fotos_checklist ON fotos(checklist_id);
