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
              <div class="stat-value" id="statAndamento"><div class="skeleton skeleton-title" style="margin: 0;"></div></div>
              <div class="stat-label">Em Andamento</div>
            </div>
            <div class="stat-card stat-green">
              <span class="material-symbols-rounded stat-icon">check_circle</span>
              <div class="stat-value" id="statHoje"><div class="skeleton skeleton-title" style="margin: 0;"></div></div>
              <div class="stat-label">Concluídos Hoje</div>
            </div>
            <div class="stat-card stat-purple">
              <span class="material-symbols-rounded stat-icon">calendar_month</span>
              <div class="stat-value" id="statMes"><div class="skeleton skeleton-title" style="margin: 0;"></div></div>
              <div class="stat-label">Este Mês</div>
            </div>
            <div class="stat-card stat-dark">
              <span class="material-symbols-rounded stat-icon">inventory_2</span>
              <div class="stat-value" id="statTotal"><div class="skeleton skeleton-title" style="margin: 0;"></div></div>
              <div class="stat-label">Total Geral</div>
            </div>
          </div>
          
          <!-- Charts Section -->
          <div class="charts-section" style="margin-top: 30px; margin-bottom: 30px;">
            <div class="grid" style="grid-template-columns: 2fr 1fr;">
              <div class="card">
                <h3><span class="material-symbols-rounded section-icon">bar_chart</span> Volume de Checklists (6 meses)</h3>
                <div style="height: 300px; position: relative;">
                  <canvas id="chartVolume"></canvas>
                </div>
              </div>
              <div class="card">
                <h3><span class="material-symbols-rounded section-icon">pie_chart</span> Status Geral</h3>
                <div style="height: 300px; position: relative;">
                  <canvas id="chartStatus"></canvas>
                </div>
              </div>
            </div>
          </div>

          <!-- Quick Actions -->
          <h2 class="section-title hide-on-mobile"><span class="material-symbols-rounded">bolt</span> Ações Rápidas</h2>
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
            ${user?.papel === 'admin' ? `
            <button class="action-card action-slate" onclick="App.navigate('admin')">
              <span class="material-symbols-rounded action-icon">manage_accounts</span>
              <span class="action-title">Usuários</span>
              <span class="action-desc">Gerenciar acesso</span>
            </button>
            ` : ''}
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
        <div id="connectionStatus" style="display:none; align-items:center; gap:5px; margin-right:15px; color:var(--vermelho); font-weight:bold; font-size:13px; background:rgba(255,0,0,0.1); padding:4px 8px; border-radius:12px;">
          <span class="material-symbols-rounded" style="font-size:16px;">wifi_off</span> OFFLINE
        </div>
        <div id="pendingSyncBadge" style="display:none; align-items:center; gap:5px; margin-right:15px; color:var(--laranja); font-weight:bold; font-size:13px; background:rgba(245,158,11,0.1); padding:4px 8px; border-radius:12px; cursor:pointer;" onclick="SyncManager.syncAll()" title="Clique para sincronizar agora">
          <span class="material-symbols-rounded" style="font-size:16px;">sync</span> <span id="pendingSyncCount">0</span> pendentes
        </div>
        <div class="global-search" style="position:relative; display:flex; align-items:center; margin-right: 15px;">
          <span class="material-symbols-rounded" style="position:absolute; left:10px; color:var(--cinza-400); font-size:20px; pointer-events:none;">search</span>
          <input type="text" id="globalSearchInput" placeholder="Busca global..." 
                 onkeydown="if(event.key === 'Enter' && this.value.trim()) App.navigate('history', {busca: this.value.trim()})"
                 style="padding: 8px 10px 8px 35px; border-radius:20px; border:1px solid var(--border-color); background:var(--bg-input); color:var(--text-color); font-size:14px; width:200px; transition:width 0.3s;"
                 onfocus="this.style.width='250px'" onblur="this.style.width='200px'">
        </div>
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
    if (typeof SyncManager !== 'undefined') {
      SyncManager.updateStatusUI(navigator.onLine);
      SyncManager.updatePendingUI();
    }
  },

  async loadStats() {
    try {
      const stats = await API.get('/checklists/stats');
      this.stats = stats;
      this.updateStatUI('statAndamento', stats.em_andamento);
      this.updateStatUI('statHoje', stats.concluidos_hoje);
      this.updateStatUI('statMes', stats.concluidos_mes);
      this.updateStatUI('statTotal', stats.total_geral);
    } catch (e) {
      console.warn('Estatísticas indisponíveis offline:', e);
    }
    
    // Load Charts
    try {
      this.loadCharts();
    } catch(e) {
      console.warn('Erro ao carregar gráficos:', e);
    }
  },

  async loadCharts() {
    if (typeof Chart === 'undefined') return; // Se Chart.js falhou em carregar
    
    const res = await API.get('/checklists/charts');
    if (!res || !res.volume) return;

    // Chart: Volume (Bar)
    const ctxVol = document.getElementById('chartVolume');
    if (ctxVol) {
      new Chart(ctxVol, {
        type: 'bar',
        data: {
          labels: res.volume.map(v => v.mes),
          datasets: [{
            label: 'Checklists Criados',
            data: res.volume.map(v => v.total),
            backgroundColor: '#4A90E2',
            borderRadius: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            y: { beginAtZero: true, ticks: { precision: 0 } }
          }
        }
      });
    }

    // Chart: Status (Doughnut)
    const ctxStatus = document.getElementById('chartStatus');
    if (ctxStatus) {
      const andamento = res.status.find(s => s.status === 'em_andamento')?.total || 0;
      const concluido = res.status.find(s => s.status === 'concluido')?.total || 0;
      
      new Chart(ctxStatus, {
        type: 'doughnut',
        data: {
          labels: ['Em Andamento', 'Concluído'],
          datasets: [{
            data: [andamento, concluido],
            backgroundColor: ['#F5A623', '#7ED321'],
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '70%',
          plugins: {
            legend: { position: 'bottom' }
          }
        }
      });
    }
  },

  updateStatUI(id, targetValue) {
    const el = document.getElementById(id);
    if (!el) return;
    
    // Convert to number
    const target = parseInt(targetValue) || 0;
    const duration = 1000;
    const steps = 30;
    const stepTime = Math.max(duration / steps, 16);
    const increment = target / (duration / stepTime);
    let current = 0;
    
    // Clear skeleton
    el.innerHTML = '0';
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        current = target;
        clearInterval(timer);
        el.classList.add('stat-animate');
      }
      el.textContent = Math.floor(current);
    }, stepTime);
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
