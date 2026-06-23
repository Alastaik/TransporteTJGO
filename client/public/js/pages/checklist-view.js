// ============================================
// PAGE: CHECKLIST VIEW (read-only details)
// ============================================
const ChecklistViewPage = {
  data: null,

  // Helpers de formatação
  fmtDate(raw) {
    if (!raw) return '—';
    const str = String(raw);
    if (str.length >= 10 && str.charAt(4) === '-') {
      const parts = str.split('T')[0].split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
    }
    try {
      const d = new Date(raw);
      if (isNaN(d.getTime())) return String(raw);
      return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch(e) { return String(raw); }
  },
  fmtHora(raw) {
    if (!raw) return '—';
    const p = String(raw).split(':');
    return p.length >= 2 ? p[0] + ':' + p[1] : String(raw);
  },
  fmtKm(raw) {
    if (!raw) return '—';
    const n = parseFloat(raw);
    return isNaN(n) ? String(raw) : n.toLocaleString('pt-BR');
  },

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
      this.loadAudit(params.id);
      this.loadFotos(params.id);
    } catch (err) {
      document.getElementById('viewContent').innerHTML = `<div class="card"><p>Erro ao carregar: ${err.message}</p></div>`;
    }
  },

  renderDetails(d) {
    const statusBadge = d.status === 'concluido'
      ? '<span class="badge badge-green">Concluído</span>'
      : '<span class="badge badge-amber">Em Andamento</span>';

    const kmRodado = d.entrada_km && d.saida_km
      ? Math.abs(parseFloat(d.entrada_km) - parseFloat(d.saida_km))
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

    <!-- Comparativo Recebimento/Entrega -->
    ${data.status === 'concluido' ? `
      <h2><span class="material-symbols-rounded section-icon">compare_arrows</span> RECEBIMENTO vs ENTREGA</h2>
      <div class="compare-container">
        <div class="compare-col">
          <div class="compare-header compare-entrada">RECEBIMENTO</div>
          <div class="compare-content"><span class="compare-label">Data</span><span>${this.fmtDate(d.entrada_data)}</span></div>
          <div class="compare-item"><span class="compare-label">Hora</span><span>${this.fmtHora(d.entrada_hora)}</span></div>
          <div class="compare-item"><span class="compare-label">KM</span><span>${this.fmtKm(d.entrada_km)}</span></div>
          <div class="compare-item"><span class="compare-label">Combustível</span><span>${d.entrada_combustivel || '—'}</span></div>
        </div>
        <div class="compare-col">
          <div class="compare-header compare-saida">ENTREGA</div>
          <div class="compare-item"><span class="compare-label">Data</span><span>${this.fmtDate(d.saida_data)}</span></div>
          <div class="compare-item"><span class="compare-label">Hora</span><span>${this.fmtHora(d.saida_hora)}</span></div>
          <div class="compare-item"><span class="compare-label">KM</span><span>${this.fmtKm(d.saida_km)}</span></div>
          <div class="compare-item"><span class="compare-label">Combustível</span><span>${d.saida_combustivel || '—'}</span></div>
        </div>
      </div>
      ${kmRodado !== null ? `<div class="km-rodado"><span class="material-symbols-rounded">speed</span> KM Rodado: <strong>${kmRodado.toLocaleString('pt-BR')} km</strong></div>` : ''}
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
        <span class="material-symbols-rounded">edit</span> RETOMAR / COMPLETAR ENTREGA
      </button>` : `
      <button class="btn btn-primary btn-lg" onclick="App.navigate('checklist', {id: ${d.id}, edit: 'entrada'})">
        <span class="material-symbols-rounded">edit</span> EDITAR RECEBIMENTO
      </button>
      <button class="btn btn-primary btn-lg" onclick="App.navigate('checklist', {id: ${d.id}, edit: 'saida'})">
        <span class="material-symbols-rounded">edit</span> EDITAR ENTREGA
      </button>`}
      <div class="view-actions">
      <button class="btn btn-primary btn-lg" onclick="ChecklistViewPage.downloadPDF(${d.id})">
        <span class="material-symbols-rounded">picture_as_pdf</span> BAIXAR PDF
      </button>
      <button class="btn btn-primary btn-lg" style="background-color:#25D366;" onclick="ChecklistViewPage.shareWhatsApp(${d.id})">
        <span class="material-symbols-rounded">share</span> WHATSAPP
      </button>
      <button class="btn btn-outline btn-lg" onclick="App.navigate('checklist', {modo: '${d.tipo}', duplicar: ${d.id}})">
        <span class="material-symbols-rounded">content_copy</span> DUPLICAR
      </button>
      <button class="btn btn-outline btn-lg" onclick="ChecklistViewPage.deleteChecklist(${d.id})" style="border-color:var(--vermelho);color:var(--vermelho);">
        <span class="material-symbols-rounded">delete</span> DELETAR
      </button>
    </div>
    
    <!-- Galeria de Fotos -->
    <div class="card">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
        <h2 style="margin:0;"><span class="material-symbols-rounded section-icon">photo_library</span> GALERIA DE FOTOS</h2>
        <label class="btn btn-sm btn-primary" style="cursor:pointer;">
          <span class="material-symbols-rounded">add_a_photo</span> Adicionar
          <input type="file" accept="image/*" style="display:none" onchange="ChecklistViewPage.uploadFoto(${d.id}, this)">
        </label>
      </div>
      <div id="fotosGallery" style="display:flex; gap:10px; flex-wrap:wrap; margin-top:10px;">
        <div class="loading-inline"><div class="loading-spinner"></div><span>Carregando fotos...</span></div>
      </div>
    </div>
    
    <!-- Histórico de Auditoria -->
    <div class="card">
      <h2><span class="material-symbols-rounded section-icon">history</span> HISTÓRICO DE AÇÕES</h2>
      <div id="auditTimeline">
        <div class="loading-inline"><div class="loading-spinner"></div><span>Carregando histórico...</span></div>
      </div>
    </div>`;
  },

  async loadFotos(id) {
    try {
      const res = await API.get(`/fotos/checklist/${id}`);
      const gallery = document.getElementById('fotosGallery');
      if (!gallery) return;

      if (!res || res.length === 0) {
        gallery.innerHTML = '<p style="color:var(--text-muted);font-size:13px;width:100%;">Nenhuma foto anexada.</p>';
        return;
      }

      gallery.innerHTML = res.map(f => `
        <div style="position:relative; width:120px; height:120px; border-radius:8px; overflow:hidden; border:1px solid var(--border-color);">
          <img src="/api/v1/fotos/download/${f.id}" style="width:100%; height:100%; object-fit:cover;" onclick="window.open('/api/v1/fotos/download/${f.id}', '_blank')">
          <button onclick="ChecklistViewPage.deleteFoto(${f.id}, ${id})" style="position:absolute; top:4px; right:4px; background:rgba(255,0,0,0.8); color:#fff; border:none; border-radius:4px; cursor:pointer; width:24px; height:24px; display:flex; align-items:center; justify-content:center;">
            <span class="material-symbols-rounded" style="font-size:16px;">delete</span>
          </button>
        </div>
      `).join('');
    } catch (err) {
      console.error(err);
      const gallery = document.getElementById('fotosGallery');
      if (gallery) gallery.innerHTML = '<p style="color:var(--vermelho);font-size:13px;">Erro ao carregar fotos.</p>';
    }
  },

  async uploadFoto(checklistId, input) {
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    try {
      App.showLoading('Enviando foto...');
      await API.uploadFoto(file, checklistId);
      App.hideLoading();
      App.toast('Foto enviada com sucesso', 'success');
      this.loadFotos(checklistId);
    } catch (err) {
      App.hideLoading();
      App.toast('Erro ao enviar foto: ' + err.message, 'error');
    } finally {
      input.value = '';
    }
  },

  async deleteFoto(fotoId, checklistId) {
    if (!confirm('Tem certeza que deseja excluir esta foto?')) return;
    try {
      App.showLoading('Excluindo...');
      await API.delete(`/fotos/${fotoId}`);
      App.hideLoading();
      App.toast('Foto excluída', 'success');
      this.loadFotos(checklistId);
    } catch (err) {
      App.hideLoading();
      App.toast('Erro ao excluir: ' + err.message, 'error');
    }
  },

  async shareWhatsApp(checklistId) {
    try {
      App.showLoading('Gerando PDF para compartilhar...');
      
      // Get data and generate PDF blob directly
      const data = await API.get(`/checklists/${checklistId}`);
      
      // Load fonts
      await PDFGenerator.initFonts();
      
      // Generate DOC
      const doc = data.tipo === 'troca' 
        ? await PDFProfessional.generateTroca(data)
        : await PDFProfessional.generateSimples(data);

      const pdfBlob = doc.output('blob');
      const file = new File([pdfBlob], `Checklist_TJGO_${checklistId}.pdf`, { type: 'application/pdf' });
      
      App.hideLoading();

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: `Checklist #${checklistId}`,
            text: `Segue em anexo o Checklist #${checklistId} do veículo ${data.veiculo_placa}.`
          });
          App.toast('Compartilhado com sucesso', 'success');
        } catch (err) {
          if (err.name !== 'AbortError') {
            App.toast('Erro ao compartilhar', 'warning');
          }
        }
      } else {
        // Fallback: copy link or text
        const text = `Checklist #${checklistId} - Vistoria do veículo ${data.veiculo_placa}.\nAcesse o sistema para visualizar os detalhes.`;
        const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
        window.open(waUrl, '_blank');
        App.toast('Compartilhamento de arquivo não suportado, abrindo WhatsApp...', 'info');
      }
    } catch (err) {
      App.hideLoading();
      App.toast('Erro: ' + err.message, 'error');
      console.error(err);
    }
  },

  async loadAudit(id) {
    try {
      const res = await API.get(`/audit/${id}`);
      const timeline = document.getElementById('auditTimeline');
      if (!timeline) return;

      if (!res.data || res.data.length === 0) {
        timeline.innerHTML = '<p style="color:var(--text-muted);font-size:13px;">Nenhum histórico registrado.</p>';
        return;
      }

      timeline.innerHTML = res.data.map((item, idx) => {
        const date = new Date(item.criado_em);
        let icon = 'edit';
        if (item.acao === 'criou') icon = 'add_circle';
        if (item.acao === 'concluiu') icon = 'check_circle';
        if (item.acao === 'deletou') icon = 'delete';

        return `
          <div style="display:flex; gap:15px; margin-bottom:15px; position:relative;">
            ${idx < res.data.length - 1 ? '<div style="position:absolute; left:11px; top:25px; bottom:-15px; width:2px; background:var(--border-color);"></div>' : ''}
            <div style="width:24px; height:24px; border-radius:50%; background:var(--bg-input); border:2px solid var(--azul-primary); display:flex; align-items:center; justify-content:center; z-index:1;">
              <span class="material-symbols-rounded" style="font-size:14px; color:var(--azul-primary);">${icon}</span>
            </div>
            <div>
              <div style="font-size:14px; font-weight:500; color:#fff;">${item.detalhes}</div>
              <div style="font-size:12px; color:var(--text-muted);">
                Por <strong>${item.usuario_nome || 'Sistema'}</strong> em ${date.toLocaleDateString('pt-BR')} às ${date.toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'})}
              </div>
            </div>
          </div>
        `;
      }).join('');
    } catch (err) {
      console.error(err);
      const timeline = document.getElementById('auditTimeline');
      if (timeline) timeline.innerHTML = '<p style="color:var(--vermelho);font-size:13px;">Erro ao carregar histórico.</p>';
    }
  },

  async downloadPDF(checklistId) {
    try {
      App.showLoading('Carregando dados...');
      const data = await API.get(`/checklists/${checklistId}`);
      App.hideLoading();
      
      // Configura o callback para receber a escolha do modal
      window.pdfModalCallback = async (modo) => {
        document.getElementById('pdfModal').classList.remove('active');
        try {
          await window.generateProfessionalPDF(data, modo);
        } catch(e) {
          console.error(e);
          App.toast('Erro ao gerar PDF: ' + e.message, 'error');
        }
      };
      
      // Abre o modal de opções de PDF
      const modal = document.getElementById('pdfModal');
      if (modal) {
        modal.classList.add('active');
      } else {
        App.toast('Erro: Modal de PDF não encontrado no HTML.', 'error');
      }
    } catch (err) {
      App.hideLoading();
      App.toast('Erro ao preparar PDF: ' + err.message, 'error');
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
