// ============================================
// AUTH.JS — Hybrid Authentication (offline + server)
// ============================================
const Auth = {
  TOKEN_KEY: 'tjgo_token',
  USER_KEY: 'tjgo_user',
  USERS_CACHE_KEY: 'tjgo_users_cache',

  // Login — try server first, fallback to offline cache
  async login(matricula, pin) {
    try {
      // Try server
      const data = await API.post('/auth/login', { matricula, pin });
      this.setSession(data.token, data.user);
      return { success: true, user: data.user };
    } catch (err) {
      // If network error, try offline
      if (!navigator.onLine || err.message === 'Failed to fetch') {
        return this.offlineLogin(matricula, pin);
      }
      return { success: false, error: err.message };
    }
  },

  offlineLogin(matricula, pin) {
    const cached = this.getCachedUsers();
    const user = cached.find(u => u.matricula === matricula.trim());
    if (user) {
      // We can't verify PIN offline, but we allow access with cached data
      this.setSession('offline_token', user);
      return { success: true, user, offline: true };
    }
    return { success: false, error: 'Sem conexão e usuário não encontrado no cache' };
  },

  setSession(token, user) {
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    // Cache user for offline login
    this.cacheUser(user);
  },

  cacheUser(user) {
    const cached = this.getCachedUsers();
    const idx = cached.findIndex(u => u.matricula === user.matricula);
    if (idx >= 0) cached[idx] = user; else cached.push(user);
    localStorage.setItem(this.USERS_CACHE_KEY, JSON.stringify(cached));
  },

  getCachedUsers() {
    try {
      return JSON.parse(localStorage.getItem(this.USERS_CACHE_KEY) || '[]');
    } catch { return []; }
  },

  getToken() {
    return localStorage.getItem(this.TOKEN_KEY);
  },

  getUser() {
    try {
      return JSON.parse(localStorage.getItem(this.USER_KEY));
    } catch { return null; }
  },

  isLoggedIn() {
    return !!this.getToken() && !!this.getUser();
  },

  logout() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    App.navigate('login');
  },

  handleUnauthorized() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    App.navigate('login');
    App.toast('Sessão expirada. Faça login novamente.', 'warning');
  },

  // Verify token on app start
  async verifySession() {
    if (!this.isLoggedIn()) return false;
    if (this.getToken() === 'offline_token') return true; // offline mode
    try {
      await API.post('/auth/verify');
      return true;
    } catch {
      return true; // Allow offline usage even if verify fails
    }
  }
};
