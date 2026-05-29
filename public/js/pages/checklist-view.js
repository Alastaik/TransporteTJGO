// ============================================
// PAGE: CHECKLIST VIEW (read-only details)
// ============================================
const ChecklistViewPage = {
  data: null,

  render(params = {}) {
    const user = Auth.getUser();
    return `
    <div class="app-layout">
      ${DashboardPage.renderHeader(user)}
      <main class="main-content">
        <div class="container">
          <div class="form-nav">
            <button class="btn-back" onclick="App.navigate('history')">
              <span class="material-symbols-rounded">arrow_back</span> Voltar
            </button>
          </div>
          <div id="viewContent">
            <div class="loading-inline"><div class="loading-spinner"></div><span>Carregando...</span></div>
          </div>
        </div>
      </main>
    </div>`;
  },

  async afterRender(params = {}) {
    if (!params.id) return;
    try {
      const data = await API.get(`/checklists/${params.id}`);
      this.data = data;
      document.getElementById('viewContent').innerHTML = this.renderDetails(data);
    } catch (err) {
      document.getElementById('viewContent').innerHTML = `<div class="card"><p>Erro ao carregar: ${err.message}</p></div>`;
    }
  },

  renderDetails(d) {
    const statusBadge = d.status === 'concluido'
      ? '<span class="badge badge-green">Concluído</span>'
      : '<span class="badge badge-amber">Em Andamento</span>';

    const kmRodado = d.entrada_km && d.saida_km
      ? (parseInt(d.saida_km) - parseInt(d.entrada_km))
      : null;

    return `
    <!-- Header -->
    <div class="topbar">
      <div class="topbar-content">
        <img src="brasao.png" alt="TJGO" crossorigin="anonymous" class="topbar-logo">
        <div class="topbar-text">
          <div class="title-main">PODER JUDICIÁRIO</div>
          <div class="subtitle">Tribunal de Justiça do Estado de Goiás</div>
        </div>
      </div>
      <div class="check-title">${statusBadge} CHECKLIST #${d.id}</div>
    </div>

    <!-- Veículo -->
    <div class="card">
      <h2><span class="material-symbols-rounded section-icon">directions_car</span> VEÍCULO</h2>
      <div class="grid">
        <div class="info-item"><span class="info-label">Placa</span><span class="info-value info-placa">${d.veiculo_placa || '—'}</span></div>
        <div class="info-item"><span class="info-label">Modelo</span><span class="info-value">${d.veiculo_modelo || '—'}</span></div>
        <div class="info-item"><span class="info-label">Marca</span><span class="info-value">${d.veiculo_marca || '—'}</span></div>
        <div class="info-item"><span class="info-label">Ano</span><span class="info-value">${d.veiculo_ano || '—'}</span></div>
        <div class="info-item"><span class="info-label">Cor</span><span class="info-value">${d.veiculo_cor || '—'}</span></div>
        <div class="info-item"><span class="info-label">Destino</span><span class="info-value">${d.destino || '—'}</span></div>
      </div>
    </div>

    <!-- Comparativo Entrada/Saída -->
    <div class="card">
      <h2><span class="material-symbols-rounded section-icon">compare_arrows</span> ENTRADA vs SAÍDA</h2>
      <div class="compare-grid">
        <div class="compare-col">
          <div class="compare-header compare-entrada">ENTRADA</div>
          <div class="compare-item"><span class="compare-label">Data</span><span>${d.entrada_data || '—'}</span></div>
          <div class="compare-item"><span class="compare-label">Hora</span><span>${d.entrada_hora || '—'}</span></div>
          <div class="compare-item"><span class="compare-label">KM</span><span>${d.entrada_km || '—'}</span></div>
          <div class="compare-item"><span class="compare-label">Combustível</span><span>${d.entrada_combustivel || '—'}</span></div>
        </div>
        <div class="compare-col">
          <div class="compare-header compare-saida">SAÍDA</div>
          <div class="compare-item"><span class="compare-label">Data</span><span>${d.saida_data || '—'}</span></div>
          <div class="compare-item"><span class="compare-label">Hora</span><span>${d.saida_hora || '—'}</span></div>
          <div class="compare-item"><span class="compare-label">KM</span><span>${d.saida_km || '—'}</span></div>
          <div class="compare-item"><span class="compare-label">Combustível</span><span>${d.saida_combustivel || '—'}</span></div>
        </div>
      </div>
      ${kmRodado !== null ? `<div class="km-rodado"><span class="material-symbols-rounded">speed</span> KM Rodado: <strong>${kmRodado} km</strong></div>` : ''}
    </div>

    <!-- Motorista -->
    <div class="card">
      <h2><span class="material-symbols-rounded section-icon">person</span> CONDUTOR / MOTORISTA</h2>
      <div class="grid">
        <div class="info-item"><span class="info-label">Nome</span><span class="info-value">${d.motorista_nome || '—'}</span></div>
        <div class="info-item"><span class="info-label">Matrícula / CNH</span><span class="info-value">${d.motorista_cnh || '—'}</span></div>
        <div class="info-item"><span class="info-label">Vistoriador</span><span class="info-value">${d.vistoriador_nome || '—'}</span></div>
      </div>
    </div>

    <!-- Actions -->
    <div class="save-area">
      ${d.status === 'em_andamento' ? `
      <button class="btn btn-primary btn-lg" onclick="App.navigate('checklist', {id: ${d.id}, retomar: true})">
        <span class="material-symbols-rounded">edit</span> RETOMAR / COMPLETAR SAÍDA
      </button>` : `
      <button class="btn btn-primary btn-lg" onclick="App.navigate('checklist', {id: ${d.id}, edit: 'entrada'})">
        <span class="material-symbols-rounded">edit</span> EDITAR ENTRADA
      </button>
      <button class="btn btn-primary btn-lg" onclick="App.navigate('checklist', {id: ${d.id}, edit: 'saida'})">
        <span class="material-symbols-rounded">edit</span> EDITAR SAÍDA
      </button>`}
      <button class="btn btn-outline btn-lg" onclick="ChecklistViewPage.downloadPDF(${d.id})">
        <span class="material-symbols-rounded">download</span> BAIXAR PDF
      </button>
      <button class="btn btn-outline btn-lg" onclick="App.navigate('checklist', {modo: '${d.tipo}', duplicar: ${d.id}})">
        <span class="material-symbols-rounded">content_copy</span> DUPLICAR
      </button>
      <button class="btn btn-outline btn-lg" onclick="ChecklistViewPage.deleteChecklist(${d.id})" style="border-color:var(--vermelho);color:var(--vermelho);">
        <span class="material-symbols-rounded">delete</span> DELETAR
      </button>
    </div>`;
  },

  async downloadPDF(checklistId) {
    try {
      const pdfs = await API.get(`/pdfs/checklist/${checklistId}`);
      if (pdfs.length > 0) {
        // Download first PDF
        window.open(`/api/v1/pdfs/${pdfs[0].id}/download`, '_blank');
      } else {
        App.toast('Nenhum PDF encontrado. Gere um PDF primeiro.', 'warning');
      }
    } catch (err) {
      App.toast('Erro: ' + err.message, 'error');
    }
  },

  async deleteChecklist(id) {
    if (!confirm('Tem certeza que deseja deletar este checklist? Esta ação não pode ser desfeita.')) return;
    
    try {
      App.showLoading('Deletando...');
      await API.delete(`/checklists/${id}`);
      App.hideLoading();
      App.toast('Checklist deletado com sucesso.', 'success');
      App.navigate('history');
    } catch (err) {
      App.hideLoading();
      App.toast('Erro ao deletar: ' + err.message, 'error');
    }
  }
};
