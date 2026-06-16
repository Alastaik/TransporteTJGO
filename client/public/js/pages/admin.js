// ============================================
// PAGE: ADMIN (Gestão de Usuários)
// ============================================
const AdminPage = {
  users: [],

  render() {
    return `
    <div class="app-layout">
      <!-- Re-use header -->
      <header class="app-header">
        <div class="header-left">
          <button class="btn-icon" onclick="App.navigate('dashboard')">
            <span class="material-symbols-rounded">arrow_back</span>
          </button>
          <div class="header-titles">
            <span class="header-title">Administração</span>
          </div>
        </div>
      </header>
      
      <main class="main-content">
        <div class="container">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 20px;">
            <h1 class="page-title"><span class="material-symbols-rounded">manage_accounts</span> Usuários</h1>
            <button class="btn btn-primary" onclick="AdminPage.openModal()"><span class="material-symbols-rounded">person_add</span> Novo Usuário</button>
          </div>
          
          <div class="card" style="padding:0; overflow-x:auto;">
            <table class="checklist-table" id="usersTable">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Matrícula</th>
                  <th>Nome</th>
                  <th>Papel</th>
                  <th>Status</th>
                  <th style="text-align:right">Ações</th>
                </tr>
              </thead>
              <tbody id="usersTbody">
                <tr><td colspan="6" style="text-align:center"><div class="skeleton skeleton-text" style="width:100%"></div></td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
    
    <!-- Modal Usuário -->
    <div id="adminUserModal" class="modal">
      <div class="modal-content modal-sm">
        <h3 id="adminUserTitle"><span class="material-symbols-rounded">person</span> Novo Usuário</h3>
        <input type="hidden" id="adminUserId">
        
        <div class="field" style="text-align:left;">
          <label>Nome Completo</label>
          <input type="text" id="adminUserName" placeholder="Ex: João da Silva">
        </div>
        <div class="field" style="text-align:left;">
          <label>Matrícula</label>
          <input type="text" id="adminUserMatricula" placeholder="Apenas números">
        </div>
        <div class="field" style="text-align:left;" id="adminUserPinContainer">
          <label>PIN (Senha)</label>
          <input type="password" id="adminUserPin" placeholder="Mínimo 4 dígitos" inputmode="numeric">
          <small style="color:var(--text-muted); font-size:11px; margin-top:4px;">Deixe em branco para manter o atual (na edição).</small>
        </div>
        <div class="field" style="text-align:left;">
          <label>Papel (Permissão)</label>
          <div class="select-wrapper">
            <select id="adminUserPapel">
              <option value="vistoriador">Vistoriador</option>
              <option value="admin">Administrador</option>
            </select>
            <span class="material-symbols-rounded select-icon">expand_more</span>
          </div>
        </div>
        
        <div class="modal-actions" style="margin-top:20px;">
          <button class="btn btn-outline" onclick="AdminPage.closeModal()">Cancelar</button>
          <button class="btn btn-primary" onclick="AdminPage.saveUser()">Salvar</button>
        </div>
      </div>
    </div>
    `;
  },

  async afterRender() {
    // Access Control Guard
    const user = Auth.getUser();
    if (!user || user.papel !== 'admin') {
      App.toast('Acesso negado.', 'error');
      App.navigate('dashboard');
      return;
    }
    
    await this.loadUsers();
  },

  async loadUsers() {
    try {
      const res = await API.get('/users');
      this.users = res.data || [];
      this.renderTable();
    } catch (err) {
      App.toast('Erro ao carregar usuários.', 'error');
      document.getElementById('usersTbody').innerHTML = `<tr><td colspan="6" style="text-align:center">Erro ao carregar dados.</td></tr>`;
    }
  },

  renderTable() {
    const tbody = document.getElementById('usersTbody');
    if (!tbody) return;
    
    if (this.users.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center">Nenhum usuário encontrado.</td></tr>`;
      return;
    }
    
    tbody.innerHTML = this.users.map(u => `
      <tr>
        <td>#${u.id}</td>
        <td><strong>${u.matricula}</strong></td>
        <td>${u.nome}</td>
        <td>
          <span class="badge ${u.papel === 'admin' ? 'badge-blue' : 'badge-slate'}">
            ${u.papel.toUpperCase()}
          </span>
        </td>
        <td>
          <span class="badge ${u.ativo ? 'badge-green' : 'badge-red'}">
            ${u.ativo ? 'ATIVO' : 'INATIVO'}
          </span>
        </td>
        <td style="text-align:right">
          <button class="btn-icon" title="Editar" onclick="AdminPage.editUser(${u.id})">
            <span class="material-symbols-rounded" style="font-size:18px">edit</span>
          </button>
          <button class="btn-icon" title="${u.ativo ? 'Desativar' : 'Ativar'}" onclick="AdminPage.toggleActive(${u.id}, ${u.ativo})">
            <span class="material-symbols-rounded" style="font-size:18px">${u.ativo ? 'block' : 'check_circle'}</span>
          </button>
        </td>
      </tr>
    `).join('');
  },

  openModal() {
    document.getElementById('adminUserId').value = '';
    document.getElementById('adminUserName').value = '';
    document.getElementById('adminUserMatricula').value = '';
    document.getElementById('adminUserPin').value = '';
    document.getElementById('adminUserPapel').value = 'vistoriador';
    document.getElementById('adminUserTitle').innerHTML = '<span class="material-symbols-rounded">person_add</span> Novo Usuário';
    
    document.getElementById('adminUserModal').classList.add('active');
  },
  
  editUser(id) {
    const u = this.users.find(x => x.id === id);
    if (!u) return;
    
    document.getElementById('adminUserId').value = u.id;
    document.getElementById('adminUserName').value = u.nome;
    document.getElementById('adminUserMatricula').value = u.matricula;
    document.getElementById('adminUserPin').value = '';
    document.getElementById('adminUserPapel').value = u.papel;
    document.getElementById('adminUserTitle').innerHTML = '<span class="material-symbols-rounded">edit</span> Editar Usuário';
    
    document.getElementById('adminUserModal').classList.add('active');
  },

  closeModal() {
    document.getElementById('adminUserModal').classList.remove('active');
  },

  async saveUser() {
    const id = document.getElementById('adminUserId').value;
    const nome = document.getElementById('adminUserName').value.trim();
    const matricula = document.getElementById('adminUserMatricula').value.trim();
    const pin = document.getElementById('adminUserPin').value.trim();
    const papel = document.getElementById('adminUserPapel').value;
    
    if (!nome || !matricula) return App.toast('Nome e matrícula são obrigatórios.', 'warning');
    if (!id && !pin) return App.toast('PIN é obrigatório para novos usuários.', 'warning');
    
    const payload = { nome, matricula, papel };
    if (pin) payload.pin = pin;
    
    App.showLoading('Salvando...');
    try {
      if (id) {
        await API.put('/users/' + id, payload);
        App.toast('Usuário atualizado com sucesso.', 'success');
      } else {
        await API.post('/users', payload);
        App.toast('Usuário criado com sucesso.', 'success');
      }
      this.closeModal();
      await this.loadUsers();
    } catch (err) {
      App.toast(err.message || 'Erro ao salvar usuário.', 'error');
    } finally {
      App.hideLoading();
    }
  },
  
  async toggleActive(id, currentStatus) {
    const action = currentStatus ? 'desativar' : 'ativar';
    if (!await App.confirm('Confirmação', `Deseja realmente ${action} este usuário?`)) return;
    
    App.showLoading('Processando...');
    try {
      await API.put('/users/' + id, { ativo: !currentStatus });
      App.toast(`Usuário ${action}do com sucesso.`, 'success');
      await this.loadUsers();
    } catch(err) {
      App.toast(err.message || 'Erro ao alterar status.', 'error');
    } finally {
      App.hideLoading();
    }
  }
};
