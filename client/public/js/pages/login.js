// ============================================
// PAGE: LOGIN
// ============================================
const LoginPage = {
  render() {
    return `
    <div class="login-page">
      <div class="login-bg"></div>
      <div class="login-card">
        <div class="login-header">
          <img src="brasao.png" alt="Brasão TJGO" class="login-logo" crossorigin="anonymous">
          <h1 class="login-title">PODER JUDICIÁRIO</h1>
          <p class="login-subtitle">Tribunal de Justiça do Estado de Goiás</p>
          <div class="login-badge">Sistema de Transporte</div>
        </div>

        <form id="loginForm" class="login-form" onsubmit="LoginPage.handleLogin(event)">
          <div class="field">
            <label><span class="material-symbols-rounded">person</span> Vistoriador</label>
            <div class="select-wrapper">
              <select id="loginMatricula" required onchange="LoginPage.onUserSelect(this.value)">
                <option value="">— Carregando Vistoriadores... —</option>
              </select>
              <span class="material-symbols-rounded select-icon">expand_more</span>
            </div>
          </div>

          <div id="customMatriculaField" class="field" style="display:none;">
            <label>Matrícula</label>
            <input type="text" id="loginCustomMatricula" placeholder="Digite sua matrícula">
          </div>

          <div class="field">
            <label><span class="material-symbols-rounded">lock</span> PIN de Acesso</label>
            <input type="password" id="loginPin" placeholder="Digite o PIN (4 dígitos)" maxlength="10" inputmode="numeric" autocomplete="off">
          </div>

          <div id="loginError" class="login-error"></div>

          <button type="submit" class="btn btn-primary btn-login" id="loginBtn">
            <span class="material-symbols-rounded">login</span>
            ENTRAR
          </button>

          <div class="login-footer">
            <span class="material-symbols-rounded" style="font-size:14px">info</span>
            PIN padrão: 1234
          </div>
        </form>
      </div>
    </div>`;
  },

  onUserSelect(value) {
    const customField = document.getElementById('customMatriculaField');
    if (customField) {
      customField.style.display = value === 'custom' ? 'flex' : 'none';
    }
  },

  async afterRender() {
    const select = document.getElementById('loginMatricula');
    try {
      const res = await fetch('/api/v1/auth/users');
      const users = await res.json();
      
      let html = '<option value="">— Selecione o Vistoriador —</option>';
      users.forEach(u => {
        html += `<option value="${u.matricula}">${u.nome} (${u.matricula})</option>`;
      });
      html += '<option value="custom">Outro (digitar matrícula)</option>';
      
      select.innerHTML = html;
    } catch (err) {
      console.error('Erro ao carregar usuarios', err);
      select.innerHTML = '<option value="">— Selecione o Vistoriador —</option><option value="custom">Outro (digitar matrícula)</option>';
    }
  },

  async handleLogin(e) {
    e.preventDefault();
    const btn = document.getElementById('loginBtn');
    const errorEl = document.getElementById('loginError');
    errorEl.textContent = '';
    btn.disabled = true;
    btn.innerHTML = '<div class="btn-spinner"></div> Entrando...';

    let matricula = document.getElementById('loginMatricula').value;
    if (matricula === 'custom') {
      matricula = document.getElementById('loginCustomMatricula').value;
    }
    const pin = document.getElementById('loginPin').value;

    if (!matricula) {
      errorEl.textContent = 'Selecione um vistoriador';
      btn.disabled = false;
      btn.innerHTML = '<span class="material-symbols-rounded">login</span> ENTRAR';
      return;
    }

    const result = await Auth.login(matricula, pin);

    if (result.success) {
      if (result.offline) {
        App.toast('Login offline — dados serão sincronizados quando houver conexão', 'warning');
      }
      App.navigate('dashboard');
    } else {
      errorEl.textContent = result.error;
      btn.disabled = false;
      btn.innerHTML = '<span class="material-symbols-rounded">login</span> ENTRAR';
    }
  }
};
