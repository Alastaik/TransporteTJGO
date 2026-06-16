# 🚗 Transporte TJGO — Sistema de Gestão de Checklists

O **Transporte TJGO** é uma aplicação corporativa moderna (PWA) desenvolvida para digitalizar e otimizar as operações de checklists veiculares do Tribunal de Justiça do Estado de Goiás.

## ✨ Principais Funcionalidades

- **Layout Profissional e Responsivo:** UI inspirada no design moderno com suporte PWA (pode ser instalado em celulares e tablets).
- **Gestão de Checklist Simplificada:** 
  - Vistorias de Entrada e Saída.
  - Registro de veículos Oficiais e de Empréstimo.
  - Campos dinâmicos (placas automáticas, nível de combustível visual, dados de viagem e checklist detalhado).
- **Trabalho Offline Nativo (Offline-First):** 
  - Utiliza `Service Worker` e `IndexedDB`.
  - Formulários salvos em modo offline entram na fila de sincronização (indicador amarelo pendente).
  - Reconexão automática em segundo plano, enviando todos os dados assim que o usuário tiver internet.
- **Assinatura Digital Dupla:** Assinaturas digitais independentes em tela do motorista/condutor e do vistoriador, injetadas perfeitamente no PDF gerado.
- **Relatórios Profissionais em PDF:** Gera PDFs estruturados instantaneamente, com cabeçalhos padronizados, cálculos de quilometragem e tempo rodado.
- **Dashboard e KPIs:** Área de administrador para visibilidade da operação (Quantidade de viagens, gráficos com Chart.js, controle de frota).

## 🛠 Tecnologias Utilizadas

- **Frontend:** HTML5, CSS3, JavaScript puro, IndexedDB, Service Worker.
- **Backend:** Node.js (Express), TypeScript.
- **Banco de Dados:** PostgreSQL (Tabelas de `checklists`, `usuarios`, `auditoria`, etc).
- **Outras Ferramentas:** `jsPDF` (Geração de relatórios PDF On-the-fly), `Chart.js` (Dashboard), `Multer` (Uploads).
- **Infraestrutura:** Docker e Docker Compose (Multi-stage builds para máxima performance).

## 📦 Como Rodar o Projeto

Toda a stack do projeto roda de forma nativa e isolada no Docker.

```bash
# 1. Clone o projeto e instale (opcional localmente):
git clone https://seu_repositorio.git transporte-tjgo
cd transporte-tjgo

# 2. Configuração de Variáveis
cp .env.example .env
# (Edite o .env se desejar, como a senha do banco)

# 3. Construa e levante os containers
docker-compose build app
docker-compose up -d
```

> 📖 **Para mais detalhes sobre como fazer o deploy na nuvem, acesse o guia:** [`README-DEPLOY.md`](README-DEPLOY.md)

---
*Sistema desenvolvido para o Poder Judiciário — TJGO*