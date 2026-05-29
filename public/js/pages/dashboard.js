// ============================================
// PAGE: DASHBOARD
// ============================================
const DashboardPage = {
  stats: null,
  emAndamento: [],

  render() {
    const user = Auth.getUser();
    return `
    <div class="app-layout">
      ${this.renderHeader(user)}
      <main class="main-content">
        <div class="container">
          <!-- Welcome -->
          <div class="welcome-section">
            <h1 class="welcome-title">Olá, ${this.firstName(user?.nome)}</h1>
            <p class="welcome-sub">${this.getGreeting()} — ${new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          </div>

          <!-- Stats Cards -->
          <div class="stats-grid" id="statsGrid">
            <div class="stat-card stat-blue">
              <span class="material-symbols-rounded stat-icon">pending</span>
              <div class="stat-value" id="statAndamento">—</div>
              <div class="stat-label">Em Andamento</div>
            </div>
            <div class="stat-card stat-green">
              <span class="material-symbols-rounded stat-icon">check_circle</span>
              <div class="stat-value" id="statHoje">—</div>
              <div class="stat-label">Concluídos Hoje</div>
            </div>
            <div class="stat-card stat-purple">
              <span class="material-symbols-rounded stat-icon">calendar_month</span>
              <div class="stat-value" id="statMes">—</div>
              <div class="stat-label">Este Mês</div>
            </div>
            <div class="stat-card stat-dark">
              <span class="material-symbols-rounded stat-icon">inventory_2</span>
              <div class="stat-value" id="statTotal">—</div>
              <div class="stat-label">Total Geral</div>
            </div>
          </div>

          <!-- Quick Actions -->
          <h2 class="section-title"><span class="material-symbols-rounded">bolt</span> Ações Rápidas</h2>
          <div class="actions-grid">
            <button class="action-card action-blue" onclick="App.navigate('checklist', {modo: 'simples'})">
              <span class="material-symbols-rounded action-icon">directions_car</span>
              <span class="action-title">Novo Checklist</span>
              <span class="action-desc">Vistoria simples (1 veículo)</span>
            </button>
            <button class="action-card action-green" onclick="App.navigate('checklist', {modo: 'troca'})">
              <span class="material-symbols-rounded action-icon">swap_horiz</span>
              <span class="action-title">Troca / Empréstimo</span>
              <span class="action-desc">2 veículos simultâneos</span>
            </button>
            <button class="action-card action-amber" onclick="App.navigate('history', {status: 'em_andamento'})">
              <span class="material-symbols-rounded action-icon">schedule</span>
              <span class="action-title">Em Andamento</span>
              <span class="action-desc">Continuar checklist pendente</span>
            </button>
            <button class="action-card action-slate" onclick="App.navigate('history')">
              <span class="material-symbols-rounded action-icon">folder_open</span>
              <span class="action-title">Histórico</span>
              <span class="action-desc">Buscar e filtrar registros</span>
            </button>
          </div>

          <!-- In-progress list -->
          <div id="emAndamentoSection" style="display:none;">
            <h2 class="section-title">
              <span class="material-symbols-rounded">pending_actions</span> 
              Checklists em Andamento
            </h2>
            <div id="emAndamentoList" class="checklist-list"></div>
          </div>
        </div>
      </main>
    </div>`;
  },

  renderHeader(user) {
    const isLight = typeof localStorage !== 'undefined' && localStorage.getItem('tjgo_theme') === 'light';
    const themeIcon = isLight ? 'dark_mode' : 'light_mode';
    
    return `
    <header class="app-header">
      <div class="header-left">
        <img src="brasao.png" alt="TJGO" class="header-logo" crossorigin="anonymous">
        <div class="header-titles">
          <span class="header-title">Transporte TJGO</span>
        </div>
      </div>
      <div class="header-right">
        <button class="btn-icon" onclick="App.toggleTheme()" title="Alternar Tema">
          <span class="material-symbols-rounded theme-icon">${themeIcon}</span>
        </button>
        <span class="header-user" onclick="App.openPinModal()" style="cursor:pointer;" title="Alterar PIN">
          <span class="material-symbols-rounded">account_circle</span>
          ${this.firstName(user?.nome)}
        </span>
        <button class="btn-icon" onclick="Auth.logout()" title="Sair">
          <span class="material-symbols-rounded">logout</span>
        </button>
      </div>
    </header>
    
    <!-- Modal Alterar PIN -->
    <div id="pinModal" class="modal">
      <div class="modal-content modal-sm">
        <h3><span class="material-symbols-rounded">lock_reset</span> Alterar PIN</h3>
        <div class="field" style="text-align:left;">
          <label>PIN Atual</label>
          <input type="password" id="pinAtual" inputmode="numeric" maxlength="8">
        </div>
        <div class="field" style="text-align:left;">
          <label>Novo PIN (min. 4 dígitos)</label>
          <input type="password" id="pinNovo" inputmode="numeric" maxlength="8">
        </div>
        <div class="modal-actions" style="margin-top:20px;">
          <button class="btn btn-outline" onclick="App.closePinModal()">Cancelar</button>
          <button class="btn btn-primary" onclick="App.saveNewPin()">Salvar</button>
        </div>
      </div>
    </div>`;
  },

  async afterRender() {
    this.loadStats();
    this.loadEmAndamento();
  },

  async loadStats() {
    try {
      const stats = await API.get('/checklists/stats');
      this.stats = stats;
      this.updateStatUI('statAndamento', stats.em_andamento);
      this.updateStatUI('statHoje', stats.concluidos_hoje);
      this.updateStatUI('statMes', stats.concluidos_mes);
      this.updateStatUI('statTotal', stats.total_geral);
    } catch (err) {
      console.warn('Erro ao carregar stats:', err);
    }
  },

  updateStatUI(id, value) {
    const el = document.getElementById(id);
    if (el) {
      el.textContent = value;
      el.classList.add('stat-animate');
    }
  },

  async loadEmAndamento() {
    try {
      const result = await API.get('/checklists?status=em_andamento&limit=10&ordem=criado_em&direcao=DESC');
      this.emAndamento = result.data || [];
      const section = document.getElementById('emAndamentoSection');
      const list = document.getElementById('emAndamentoList');
      if (!section || !list) return;

      if (this.emAndamento.length === 0) {
        section.style.display = 'none';
        return;
      }

      section.style.display = 'block';
      list.innerHTML = this.emAndamento.map(c => `
        <div class="checklist-card" onclick="App.navigate('checklist', {id: ${c.id}, retomar: true})">
          <div class="cc-header">
            <span class="badge badge-amber">Em Andamento</span>
            <span class="cc-date">${this.formatDate(c.criado_em)}</span>
          </div>
          <div class="cc-body">
            <div class="cc-placa">${c.tipo === 'troca' ? (c.veiculo_placa || '—') + ' 🔄 ' + (c.emp_placa || '—') : c.veiculo_placa || '—'}</div>
            <div class="cc-info">${c.veiculo_modelo || ''} • ${c.destino || 'Sem destino'}</div>
            <div class="cc-meta">
              <span><span class="material-symbols-rounded" style="font-size:14px">person</span> ${c.motorista_nome || '—'}</span>
              <span>${c.tipo === 'troca' ? '🔄 Troca (2 Veículos)' : '🚗 Simples'}</span>
            </div>
          </div>
          <div class="cc-action">
            <span class="material-symbols-rounded">arrow_forward</span>
          </div>
        </div>
      `).join('');
    } catch (err) {
      console.warn('Erro ao carregar em andamento:', err);
    }
  },

  firstName(nome) {
    if (!nome) return 'Usuário';
    return nome.split(' ')[0].charAt(0).toUpperCase() + nome.split(' ')[0].slice(1).toLowerCase();
  },

  getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return 'Bom dia';
    if (h < 18) return 'Boa tarde';
    return 'Boa noite';
  },

  formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }
};
