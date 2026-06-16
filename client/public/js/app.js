// ============================================
// APP.JS — SPA Router & Main Application
// ============================================
const App = {
  currentPage: null,
  currentParams: null,

  pages: {
    login: LoginPage,
    dashboard: DashboardPage,
    checklist: ChecklistFormPage,
    view: ChecklistViewPage,
    history: HistoryPage,
    admin: AdminPage
  },

  async init() {
    // Init local database
    try { await LocalDB.init(); } catch (e) { console.warn('IndexedDB error:', e); }

    // Start sync manager
    SyncManager.start();
    
    // Init Theme
    this.initTheme();

    // Check auth and navigate
    if (Auth.isLoggedIn()) {
      await Auth.verifySession();
      this.navigate('dashboard');
    } else {
      this.navigate('login');
    }

    // Handle back button
    window.addEventListener('popstate', (e) => {
      if (e.state && e.state.page) {
        this.renderPage(e.state.page, e.state.params || {}, false);
      }
    });
  },
  
  initTheme() {
    const saved = localStorage.getItem('tjgo_theme');
    if (saved === 'light') document.body.setAttribute('data-theme', 'light');
    else document.body.removeAttribute('data-theme');
  },

  toggleTheme() {
    const current = document.body.getAttribute('data-theme');
    if (current === 'light') {
      document.body.removeAttribute('data-theme');
      localStorage.setItem('tjgo_theme', 'dark');
    } else {
      document.body.setAttribute('data-theme', 'light');
      localStorage.setItem('tjgo_theme', 'light');
    }
    // Update icons if present
    document.querySelectorAll('.theme-icon').forEach(i => {
      i.textContent = document.body.getAttribute('data-theme') === 'light' ? 'dark_mode' : 'light_mode';
    });
  },
  
  openPinModal() {
    const m = document.getElementById('pinModal');
    if (m) m.style.display = 'flex';
  },
  
  closePinModal() {
    const m = document.getElementById('pinModal');
    if (m) m.style.display = 'none';
  },
  
  async saveNewPin() {
    const atual = document.getElementById('pinAtual').value;
    const novo = document.getElementById('pinNovo').value;
    if (!atual || !novo) return this.toast('Preencha os dois campos.', 'warning');
    if (novo.length < 4) return this.toast('O novo PIN deve ter pelo menos 4 dígitos.', 'warning');
    
    this.showLoading('Alterando PIN...');
    try {
      await API.put('/auth/pin', { pinAtual: atual, novoPin: novo });
      this.hideLoading();
      this.toast('PIN alterado com sucesso!', 'success');
      this.closePinModal();
    } catch (err) {
      this.hideLoading();
      this.toast(err.message || 'Erro ao alterar PIN.', 'error');
    }
  },

  navigate(pageName, params = {}, pushState = true) {
    if (!this.pages[pageName]) {
      console.error('Página não encontrada:', pageName);
      return;
    }

    // Guard: require auth for all pages except login
    if (pageName !== 'login' && !Auth.isLoggedIn()) {
      pageName = 'login';
      params = {};
    }

    this.renderPage(pageName, params, pushState);
  },

  renderPage(pageName, params = {}, pushState = true) {
    const page = this.pages[pageName];
    if (!page) return;

    this.currentPage = pageName;
    this.currentParams = params;

    // Render page HTML
    const app = document.getElementById('app');
    if (!app) return;

    app.innerHTML = page.render(params);

    // Scroll to top
    window.scrollTo(0, 0);

    // Push to browser history
    if (pushState) {
      history.pushState({ page: pageName, params }, '', `#${pageName}`);
    }

    // Call afterRender if exists (async data loading)
    if (typeof page.afterRender === 'function') {
      page.afterRender(params);
    }
  },

  // Toast notifications
  toast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const icons = {
      success: 'check_circle', error: 'error', warning: 'warning', info: 'info'
    };

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <span class="material-symbols-rounded toast-icon">${icons[type] || 'info'}</span>
      <span class="toast-msg">${message}</span>
    `;
    container.appendChild(toast);

    // Animate in
    requestAnimationFrame(() => toast.classList.add('toast-show'));

    // Remove after 4s
    setTimeout(() => {
      toast.classList.remove('toast-show');
      toast.classList.add('toast-hide');
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  },

  showLoading(text = 'Carregando...') {
    const el = document.getElementById('loadingOverlay');
    const textEl = el?.querySelector('.loading-text');
    if (textEl) textEl.textContent = text;
    if (el) el.classList.add('active');
  },

  hideLoading() {
    const el = document.getElementById('loadingOverlay');
    if (el) el.classList.remove('active');
  },

  // Confirm dialog
  confirm(title, message) {
    return new Promise((resolve) => {
      const modal = document.getElementById('confirmModal');
      const titleEl = document.getElementById('confirmTitle');
      const msgEl = document.getElementById('confirmMessage');
      const yesBtn = document.getElementById('confirmYes');
      const noBtn = document.getElementById('confirmNo');

      if (titleEl) titleEl.textContent = title;
      if (msgEl) msgEl.textContent = message;
      if (modal) modal.style.display = 'flex';

      const cleanup = (result) => {
        if (modal) modal.style.display = 'none';
        yesBtn.removeEventListener('click', onYes);
        noBtn.removeEventListener('click', onNo);
        resolve(result);
      };
      const onYes = () => cleanup(true);
      const onNo = () => cleanup(false);

      yesBtn.addEventListener('click', onYes);
      noBtn.addEventListener('click', onNo);
    });
  }
};

// ============ BOOT ============
window.addEventListener('DOMContentLoaded', () => App.init());
