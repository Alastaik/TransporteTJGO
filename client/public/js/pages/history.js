// ============================================
// PAGE: HISTORY — Filtros avançados
// ============================================
const HistoryPage = {
  currentPage: 1,
  filters: {},
  results: [],

  render(params = {}) {
    this.filters = params || {};
    this.currentPage = 1;
    const user = Auth.getUser();

    return `
    <div class="app-layout">
      ${DashboardPage.renderHeader(user)}
      <main class="main-content">
        <div class="container">
          <div class="form-nav">
            <button class="btn-back" onclick="App.navigate('dashboard')">
              <span class="material-symbols-rounded">arrow_back</span> Dashboard
            </button>
            <h1 class="page-title">Histórico de Checklists</h1>
          </div>

          <!-- Filters -->
          <div class="card filter-card">
            <div class="filter-toggle" onclick="HistoryPage.toggleFilters()">
              <span class="material-symbols-rounded">filter_list</span>
              <span>Filtros de Busca</span>
              <span class="material-symbols-rounded" id="filterArrow">expand_more</span>
            </div>
            <div id="filtersBody" class="filters-body">
              <div class="grid">
                <div class="field">
                  <label>Busca Geral</label>
                  <input type="text" id="filterBusca" placeholder="Placa, nome, destino..." oninput="HistoryPage.onFilterChange()">
                </div>
                <div class="field">
                  <label>Status</label>
                  <div class="select-wrapper">
                    <select id="filterStatus" onchange="HistoryPage.onFilterChange()">
                      <option value="">Todos</option>
                      <option value="em_andamento">Em Andamento</option>
                      <option value="concluido">Concluídos</option>
                    </select>
                    <span class="material-symbols-rounded select-icon">expand_more</span>
                  </div>
                </div>
              </div>
              <div class="grid">
                <div class="field">
                  <label>Data Início</label>
                  <input type="date" id="filterDataInicio" onchange="HistoryPage.onFilterChange()">
                </div>
                <div class="field">
                  <label>Data Fim</label>
                  <input type="date" id="filterDataFim" onchange="HistoryPage.onFilterChange()">
                </div>
              </div>
              <div class="grid">
                <div class="field">
                  <label>Placa</label>
                  <input type="text" id="filterPlaca" placeholder="RCH1B48" oninput="HistoryPage.onFilterChange()">
                </div>
                <div class="field">
                  <label>Destino</label>
                  <input type="text" id="filterDestino" placeholder="Destino / Comarca" oninput="HistoryPage.onFilterChange()">
                </div>
              </div>
              <div class="grid">
                <div class="field">
                  <label>Motorista / Condutor</label>
                  <input type="text" id="filterMotorista" placeholder="Nome do motorista" oninput="HistoryPage.onFilterChange()">
                </div>
                <div class="field">
                  <label>Tipo</label>
                  <div class="select-wrapper">
                    <select id="filterTipo" onchange="HistoryPage.onFilterChange()">
                      <option value="">Todos</option>
                      <option value="simples">Simples</option>
                      <option value="troca">Troca/Empréstimo</option>
                    </select>
                    <span class="material-symbols-rounded select-icon">expand_more</span>
                  </div>
                </div>
              </div>
              <div class="filter-actions">
                <button class="btn btn-sm btn-outline" onclick="HistoryPage.clearFilters()">
                  <span class="material-symbols-rounded">clear_all</span> Limpar
                </button>
                <button class="btn btn-sm btn-outline" onclick="HistoryPage.exportCSV()">
                  <span class="material-symbols-rounded">download</span> Exportar CSV
                </button>
              </div>
            </div>
          </div>

          <!-- Results -->
          <div id="historyResults" class="checklist-list">
            <div class="loading-inline"><div class="loading-spinner"></div><span>Buscando...</span></div>
          </div>

          <!-- Pagination -->
          <div id="historyPagination" class="pagination"></div>
        </div>
      </main>
    </div>`;
  },

  async afterRender(params = {}) {
    // Pre-fill filters from params
    if (params.status) {
      const el = document.getElementById('filterStatus');
      if (el) el.value = params.status;
    }
    if (params.busca) {
      const el = document.getElementById('filterBusca');
      if (el) el.value = params.busca;
    }
    this.search();
  },

  _debounceTimer: null,
  onFilterChange() {
    clearTimeout(this._debounceTimer);
    this._debounceTimer = setTimeout(() => {
      this.currentPage = 1;
      this.search();
    }, 400);
  },

  toggleFilters() {
    const body = document.getElementById('filtersBody');
    const arrow = document.getElementById('filterArrow');
    if (body) {
      body.classList.toggle('open');
      if (arrow) arrow.textContent = body.classList.contains('open') ? 'expand_less' : 'expand_more';
    }
  },

  clearFilters() {
    ['filterBusca', 'filterStatus', 'filterDataInicio', 'filterDataFim', 'filterPlaca', 'filterDestino', 'filterMotorista', 'filterTipo'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    this.currentPage = 1;
    this.search();
  },

  async search() {
    const params = new URLSearchParams();
    const busca = document.getElementById('filterBusca')?.value;
    const status = document.getElementById('filterStatus')?.value;
    const dataInicio = document.getElementById('filterDataInicio')?.value;
    const dataFim = document.getElementById('filterDataFim')?.value;
    const placa = document.getElementById('filterPlaca')?.value;
    const destino = document.getElementById('filterDestino')?.value;
    const motorista = document.getElementById('filterMotorista')?.value;
    const tipo = document.getElementById('filterTipo')?.value;

    if (busca) params.set('busca', busca);
    if (status) params.set('status', status);
    if (dataInicio) params.set('data_inicio', dataInicio);
    if (dataFim) params.set('data_fim', dataFim);
    if (placa) params.set('placa', placa);
    if (destino) params.set('destino', destino);
    if (motorista) params.set('motorista', motorista);
    if (tipo) params.set('tipo', tipo);
    params.set('page', this.currentPage);
    params.set('limit', 15);

    try {
      const result = await API.get(`/checklists?${params.toString()}`);
      this.results = result.data || [];
      this.renderResults(result);
    } catch (err) {
      const el = document.getElementById('historyResults');
      if (el) el.innerHTML = `<div class="empty-state"><span class="material-symbols-rounded">error</span><p>Erro ao buscar: ${err.message}</p></div>`;
    }
  },

  renderResults(result) {
    const container = document.getElementById('historyResults');
    const pagination = document.getElementById('historyPagination');
    if (!container) return;

    if (!result.data || result.data.length === 0) {
      container.innerHTML = `<div class="empty-state"><span class="material-symbols-rounded" style="font-size:48px;color:var(--cinza-400)">search_off</span><p>Nenhum checklist encontrado</p></div>`;
      if (pagination) pagination.innerHTML = '';
      return;
    }

    container.innerHTML = result.data.map(c => {
      const statusBadge = c.status === 'concluido'
        ? '<span class="badge badge-green">Concluído</span>'
        : '<span class="badge badge-amber">Em Andamento</span>';
      const tipoBadge = c.tipo === 'troca' ? '<span class="badge badge-purple">Troca</span>' : '';

      return `
      <div class="checklist-card" onclick="App.navigate('view', {id: ${c.id}})">
        <div class="cc-header">
          ${statusBadge} ${tipoBadge}
          <span class="cc-date">${this.formatDate(c.criado_em)}</span>
        </div>
        <div class="cc-body">
          <div class="cc-placa">${c.tipo === 'troca' ? (c.veiculo_placa || '—') + ' 🔄 ' + (c.emp_placa || '—') : c.veiculo_placa || '—'}</div>
          <div class="cc-info">${c.veiculo_modelo || ''} ${c.destino ? '• ' + c.destino : ''}</div>
          <div class="cc-meta">
            <span><span class="material-symbols-rounded" style="font-size:14px">person</span> ${c.motorista_nome || '—'}</span>
            <span><span class="material-symbols-rounded" style="font-size:14px">badge</span> ${c.vistoriador_nome || '—'}</span>
          </div>
        </div>
        <div class="cc-action"><span class="material-symbols-rounded">chevron_right</span></div>
      </div>`;
    }).join('');

    // Pagination
    if (pagination && result.pagination) {
      const p = result.pagination;
      if (p.pages > 1) {
        let html = '<div class="pagination-inner">';
        if (p.page > 1) html += `<button class="btn-page" onclick="HistoryPage.goToPage(${p.page - 1})"><span class="material-symbols-rounded">chevron_left</span></button>`;
        for (let i = 1; i <= p.pages; i++) {
          if (i === p.page) html += `<button class="btn-page active">${i}</button>`;
          else if (Math.abs(i - p.page) <= 2 || i === 1 || i === p.pages) html += `<button class="btn-page" onclick="HistoryPage.goToPage(${i})">${i}</button>`;
          else if (Math.abs(i - p.page) === 3) html += '<span class="page-dots">...</span>';
        }
        if (p.page < p.pages) html += `<button class="btn-page" onclick="HistoryPage.goToPage(${p.page + 1})"><span class="material-symbols-rounded">chevron_right</span></button>`;
        html += `</div><div class="pagination-info">${p.total} registros</div>`;
        pagination.innerHTML = html;
      } else {
        pagination.innerHTML = `<div class="pagination-info">${p.total} registros</div>`;
      }
    }
  },

  goToPage(page) {
    this.currentPage = page;
    this.search();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  async exportCSV() {
    try {
      App.showLoading('Exportando...');
      
      const params = new URLSearchParams();
      const busca = document.getElementById('filterBusca')?.value;
      const status = document.getElementById('filterStatus')?.value;
      const dataInicio = document.getElementById('filterDataInicio')?.value;
      const dataFim = document.getElementById('filterDataFim')?.value;
      const placa = document.getElementById('filterPlaca')?.value;
      const destino = document.getElementById('filterDestino')?.value;
      const motorista = document.getElementById('filterMotorista')?.value;
      const tipo = document.getElementById('filterTipo')?.value;

      if (busca) params.set('busca', busca);
      if (status) params.set('status', status);
      if (dataInicio) params.set('data_inicio', dataInicio);
      if (dataFim) params.set('data_fim', dataFim);
      if (placa) params.set('placa', placa);
      if (destino) params.set('destino', destino);
      if (motorista) params.set('motorista', motorista);
      if (tipo) params.set('tipo', tipo);

      const token = Auth.getToken();
      const res = await fetch(`/api/v1/checklists/export?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) throw new Error('Falha ao exportar os dados do servidor');

      const blob = await res.blob();
      if (blob.size === 0) {
        App.hideLoading();
        App.toast('Nenhum dado para exportar', 'warning');
        return;
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `relatorio_checklists_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);

      App.hideLoading();
      App.toast('Relatório exportado!', 'success');
    } catch (err) {
      App.hideLoading();
      App.toast('Erro na exportação: ' + err.message, 'error');
    }
  },

  formatDate(dateStr) {
    if (!dateStr) return '';
    const str = String(dateStr);
    if (str.length >= 10 && str.charAt(4) === '-') {
      const parts = str.split('T')[0].split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
    }
    const d = new Date(dateStr);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }
};
