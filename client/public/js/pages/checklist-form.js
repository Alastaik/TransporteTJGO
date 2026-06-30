// ============================================
// PAGE: CHECKLIST FORM
// ============================================
const ChecklistFormPage = {
  modo: 'simples',
  fase: 'entrada',
  checklistId: null,
  existingData: null,
  fotosCaptured: {},
  isDirty: false,

  ITENS_CHECKLIST: [
    'Óleo','Arrefecimento','Bateria','Pneus','Rodas','Tapetes',
    'Extintor','Som','Vidros elétricos','Manual','Documentos Detran',
    'Chave reserva','Cartão de abastecimento','Chave de roda','Macaco',
    'Triângulo','Estepe'
  ],
  DEFEITOS_OPTIONS: ['Normal','Rasgado','Quebrado','Papo','Furado','Estragado','Baixo'],
  FOTOS_GERAIS: [
    'Frente','Coluna Diant. Esq.','Lado Esquerdo',
    'Coluna Tras. Esq.','Coluna Diant. Dir.',
    'Coluna Tras. Dir.','Lado Direito','Traseira','Painel'
  ],

  setFaseInicial(novaFase) {
    if (this.fase === novaFase) return;
    this.fase = novaFase;
    
    const badge = document.getElementById('faseBadge');
    if (badge) {
      badge.textContent = novaFase === 'saida' ? 'ENTREGA' : 'RECEBIMENTO';
      badge.className = 'badge ' + (novaFase === 'saida' ? 'badge-green' : 'badge-primary');
    }
    
    const titulo = document.getElementById('tituloChecklist');
    if (titulo) {
      titulo.textContent = 'CHECKLIST VEICULAR — ' + (novaFase === 'saida' ? 'ENTREGA' : 'RECEBIMENTO');
    }

    const btnEntrada = document.getElementById('btnEntradaFase');
    const btnSaida = document.getElementById('btnSaidaFase');
    if (novaFase === 'saida') {
        if (btnEntrada) { btnEntrada.classList.remove('btn-primary'); btnEntrada.classList.add('btn-outline'); }
        if (btnSaida) { btnSaida.classList.remove('btn-outline'); btnSaida.classList.add('btn-primary'); }
        document.getElementById('saveArea').innerHTML = `
            <button type="button" class="btn btn-green btn-lg" onclick="ChecklistFormPage.salvarSaida()">
              <span class="material-symbols-rounded">check_circle</span>
              SALVAR ENTREGA (Em Andamento)
            </button>
        `;
    } else {
        if (btnSaida) { btnSaida.classList.remove('btn-primary'); btnSaida.classList.add('btn-outline'); }
        if (btnEntrada) { btnEntrada.classList.remove('btn-outline'); btnEntrada.classList.add('btn-primary'); }
        
        const saveAreaContent = document.getElementById('saveAreaContent');
        if (saveAreaContent) {
          saveAreaContent.innerHTML = `
              <div class="form-actions sticky-actions">
                <button type="button" id="btnSalvarEntrada" class="btn btn-primary btn-lg" onclick="ChecklistFormPage.salvarEntrada()">
                  <span class="material-symbols-rounded">save</span>
                  SALVAR RECEBIMENTO (Em Andamento)
                </button>
                <button type="button" id="btnSalvarUnico" class="btn btn-green btn-lg" onclick="ChecklistFormPage.salvarUnico()" style="display: none;">
                  <span class="material-symbols-rounded">check_circle</span>
                  CONCLUIR CHECKLIST ÚNICO
                </button>
              </div>
          `;
        }
        // Trigger checkbox check
        const chkUnico = document.getElementById('chkUnico');
        if (chkUnico) this.toggleChecklistUnico(chkUnico);
    }
  },

  toggleSaveArea() {
    const content = document.getElementById('saveAreaContent');
    const icon = document.getElementById('saveAreaIcon');
    if (content) {
      if (content.classList.contains('collapsed')) {
        content.classList.remove('collapsed');
        if (icon) icon.textContent = 'keyboard_arrow_down';
      } else {
        content.classList.add('collapsed');
        if (icon) icon.textContent = 'keyboard_arrow_up';
      }
    }
  },

  render(params = {}) {
    this.modo = params.modo || 'simples';
    this.checklistId = params.id || null;
    this.isEdit = !!params.edit;
    this.isRetomar = !!params.retomar;
    this.fase = params.edit ? params.edit : (params.retomar ? 'saida' : 'entrada');
    this.existingData = null;
    this.fotosCaptured = {};
    this.isDirty = false;

    // Guard de saída — avisa se tiver dados não salvos
    window.onbeforeunload = (e) => {
      if (this.isDirty) { e.preventDefault(); return ''; }
    };

    const user = Auth.getUser();
    const faseLabel = this.fase === 'saida' ? 'ENTREGA' : 'RECEBIMENTO';
    const btnColor = this.fase === 'saida' ? 'btn-green' : 'btn-primary';
    const badgeColor = this.fase === 'saida' ? 'badge-green' : 'badge-primary';

    return `
    <div class="app-layout">
      ${DashboardPage.renderHeader(user)}
      <main class="main-content">
        <div class="container">

          <!-- Top Nav -->
          <div class="form-nav">
            <button class="btn-back" onclick="ChecklistFormPage.navigateBack()">
              <span class="material-symbols-rounded">arrow_back</span> Voltar
            </button>
            <div>
              <span class="badge ${badgeColor}" id="faseBadge">${faseLabel}</span>
              ${this.modo === 'troca' ? '<span class="badge badge-green">Troca/Empréstimo</span>' : ''}
            </div>
          </div>

          <!-- Header -->
          <div class="topbar">
            <div class="topbar-content">
              <img src="brasao.png" alt="Brasão TJGO" crossorigin="anonymous" class="topbar-logo">
              <div class="topbar-text">
                <div class="title-main">PODER JUDICIÁRIO</div>
                <div class="subtitle">Tribunal de Justiça do Estado de Goiás</div>
              </div>
            </div>
            <div class="check-title" id="tituloChecklist">CHECKLIST VEICULAR — ${faseLabel}</div>
          </div>

          ${!this.checklistId ? `
          <div class="card card-info" style="margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap;">
            <div><strong>Fase Inicial:</strong> Escolha qual momento está registrando agora.</div>
            <div class="split-actions">
              <button id="btnEntradaFase" class="btn ${this.fase === 'entrada' ? 'btn-primary' : 'btn-outline'}" onclick="ChecklistFormPage.setFaseInicial('entrada')">
                <span class="material-symbols-rounded">login</span> COMEÇAR PELO RECEBIMENTO
              </button>
              <button id="btnSaidaFase" class="btn ${this.fase === 'saida' ? 'btn-primary' : 'btn-outline'}" onclick="ChecklistFormPage.setFaseInicial('saida')">
                <span class="material-symbols-rounded">logout</span> COMEÇAR PELA ENTREGA
              </button>
            </div>
          </div>
          ` : ''}

          ${this.modo === 'troca' ? this.renderAbas() : ''}

          <!-- Stepper de Progresso -->
          ${this.renderStepper()}

          <!-- FORM: OFICIAL -->
          <div id="form-oficial">
            ${this.renderViagemSection('')}
            ${this.renderVeiculoSection('')}
            ${this.renderChecklistSection('')}
            ${this.renderFotosSection('geral-oficial', this.FOTOS_GERAIS, 'oficial')}
            ${this.renderFotosSection('avarias-oficial', 10, 'oficial')}
            ${this.renderObsSection('')}
          </div>

          ${this.modo === 'troca' ? `
          <!-- FORM: EMPRÉSTIMO -->
          <div id="form-emprestimo" class="hidden">
            ${this.renderViagemSection('_emp')}
            ${this.renderVeiculoSection('_emp')}
            ${this.renderChecklistSection('_emp')}
            ${this.renderFotosSection('geral-emprestimo', this.FOTOS_GERAIS, 'emprestimo')}
            ${this.renderFotosSection('avarias-emprestimo', 10, 'emprestimo')}
            ${this.renderObsSection('_emp')}
          </div>` : ''}

          <!-- Assinaturas -->
          <div class="card" id="cardAssinatura" data-step="4">
            <h2><span class="material-symbols-rounded section-icon">draw</span> ASSINATURAS</h2>
            <div class="grid">
              <div style="text-align:center;margin-bottom:10px;">
                <label class="signature-label">Assinatura do Condutor / Motorista:</label>
                <div class="signature-container">
                  <img id="signaturePreview" class="signature-preview" onclick="openSign('signaturePreview')" alt="Toque para assinar">
                  <div class="signature-placeholder" onclick="openSign('signaturePreview')">
                    <span class="material-symbols-rounded">edit</span>
                    <span>Assinar (Condutor)</span>
                  </div>
                </div>
              </div>
              <div style="text-align:center;margin-bottom:10px;">
                <label class="signature-label">Assinatura do Vistoriador:</label>
                <div class="signature-container">
                  <img id="signaturePreview_vistoriador" class="signature-preview" onclick="openSign('signaturePreview_vistoriador')" alt="Toque para assinar">
                  <div class="signature-placeholder" onclick="openSign('signaturePreview_vistoriador')">
                    <span class="material-symbols-rounded">edit</span>
                    <span>Assinar (Vistoriador)</span>
                  </div>
                </div>
              </div>
            </div>
            <div class="grid">
              <div class="field"><label>Nome do Condutor / Motorista</label><input type="text" id="nomeCondutor" placeholder="Nome completo"></div>
              <div class="field"><label>Matrícula / CNH</label><input type="text" id="cnhCondutor" placeholder="Matrícula ou CNH"></div>
            </div>
          </div>

          <!-- Save Actions -->
          <div class="save-area" id="saveArea">
            <div class="save-area-toggle" onclick="ChecklistFormPage.toggleSaveArea()">
              <span class="material-symbols-rounded" id="saveAreaIcon">keyboard_arrow_down</span>
              <span>Ações do Checklist</span>
            </div>
            
              <div id="saveAreaContent" class="save-area-content">
              ${this.fase === 'entrada' ? `
              <div style="background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.3); padding: 15px; border-radius: var(--radius-sm); margin-bottom: 20px; text-align: left;">
                <label for="checkEntradaSaida" style="cursor: pointer; display: flex; flex-direction: column; gap: 4px;">
                  <div style="display: flex; align-items: center; gap: 10px;">
                    <input type="checkbox" id="checkEntradaSaida" style="width: 20px; height: 20px;" onchange="ChecklistFormPage.toggleChecklistUnico(this.checked)">
                    <strong>Registrar Recebimento e Entrega (Checklist Único)</strong>
                  </div>
                  <span style="font-size: 12px; color: var(--cinza-400);">
                    Atenção: Ao marcar esta opção, o checklist será concluído imediatamente. Os dados preenchidos serão salvos tanto para o Recebimento quanto para a Entrega.
                  </span>
                </label>
              </div>

              <div id="acoesEntradaContainer" style="display: flex; flex-direction: column; gap: 10px;">
                <button type="button" id="btnSalvarEntrada" class="btn btn-primary btn-lg" onclick="ChecklistFormPage.salvarEntrada(false)">
                  <span class="material-symbols-rounded">save</span>
                  ${this.isEdit ? 'SALVAR ALTERAÇÕES (RECEBIMENTO)' : 'SALVAR RECEBIMENTO (Em Andamento)'}
                </button>
                ${(this.existingData && this.existingData.saida_data) ? `
                <button type="button" id="btnFinalizarEntrada" class="btn btn-green btn-lg" onclick="ChecklistFormPage.salvarEntrada(true)">
                  <span class="material-symbols-rounded">check_circle</span>
                  FINALIZAR CHECKLIST
                </button>
                ` : ''}
              </div>

              ${!this.isEdit ? `
              <button type="button" id="btnSalvarUnico" class="btn btn-green btn-lg" onclick="ChecklistFormPage.salvarUnico()" style="display: none;">
                <span class="material-symbols-rounded">check_circle</span>
                CONCLUIR CHECKLIST ÚNICO
              </button>
              ` : ''}
              ` : `
              <div style="display: flex; flex-direction: column; gap: 10px;">
                <button type="button" class="btn btn-outline btn-lg" style="border-color: var(--verde); color: var(--verde);" onclick="ChecklistFormPage.salvarSaida(false)">
                  <span class="material-symbols-rounded">save</span>
                  ${this.isEdit ? 'SALVAR ALTERAÇÕES (ENTREGA)' : 'SALVAR ENTREGA (Rascunho)'}
                </button>
                <button type="button" class="btn btn-green btn-lg" onclick="ChecklistFormPage.salvarSaida(true)">
                  <span class="material-symbols-rounded">check_circle</span>
                  FINALIZAR CHECKLIST
                </button>
              </div>
              `}
              
              <button type="button" class="btn btn-outline btn-lg" onclick="ChecklistFormPage.gerarPDF('oficial')">
                <span class="material-symbols-rounded">description</span>
                GERAR PDF
              </button>
              ${this.modo === 'troca' ? `
              <button type="button" class="btn btn-outline btn-lg" onclick="ChecklistFormPage.gerarPDF('emprestimo')" style="border-color:var(--verde);color:var(--verde);">
                <span class="material-symbols-rounded">description</span>
                GERAR PDF — EMPRÉSTIMO
              </button>
              <button type="button" class="btn btn-outline btn-lg" onclick="ChecklistFormPage.gerarPDF('ambos')" style="border-color:var(--roxo);color:var(--roxo);">
                <span class="material-symbols-rounded">picture_as_pdf</span>
                GERAR PDF UNIFICADO
              </button>
              ` : ''}
            </div>
          </div>

        </div>
      </main>
    </div>`;
  },

  renderStepper() {
    return `
    <div class="stepper-wrapper">
      <div class="stepper-progress"><div class="stepper-progress-bar" id="stepperProgressBar"></div></div>
      <div class="stepper-steps">
        <div class="stepper-step active" data-step-target="0">
          <div class="stepper-circle">1</div>
          <div class="stepper-label">Viagem</div>
        </div>
        <div class="stepper-step" data-step-target="1">
          <div class="stepper-circle">2</div>
          <div class="stepper-label">Veículo</div>
        </div>
        <div class="stepper-step" data-step-target="2">
          <div class="stepper-circle">3</div>
          <div class="stepper-label">Checklist</div>
        </div>
        <div class="stepper-step" data-step-target="3">
          <div class="stepper-circle">4</div>
          <div class="stepper-label">Fotos</div>
        </div>
        <div class="stepper-step" data-step-target="4">
          <div class="stepper-circle">5</div>
          <div class="stepper-label">Assinatura</div>
        </div>
      </div>
    </div>`;
  },

  renderAbas() {
    return `
    <div class="abas-controle" style="display:flex;">
      <button type="button" id="abaOficial" class="aba-btn oficial" onclick="ChecklistFormPage.alternarAba('oficial')">
        <span class="material-symbols-rounded">account_balance</span> 1. VEÍCULO OFICIAL
      </button>
      <button type="button" id="abaEmprestimo" class="aba-btn inactive" onclick="ChecklistFormPage.alternarAba('emprestimo')">
        <span class="material-symbols-rounded">key</span> 2. EMPRÉSTIMO
      </button>
    </div>`;
  },

  renderViagemSection(suffix) {
    const isEmp = suffix === '_emp';
    const syncObj = !isEmp ? `oninput="ChecklistFormPage.syncField(this, '_emp'); this.style.height=''; this.style.height=this.scrollHeight+'px'"` : `oninput="this.style.height=''; this.style.height=this.scrollHeight+'px'"`;
    
    return `
    <div class="card ${isEmp ? 'emprestimo-card' : ''}" data-step="0">
      <h2 class="${isEmp ? 'emprestimo-title' : ''}"><span class="material-symbols-rounded section-icon">map</span> DADOS DA VIAGEM</h2>
      <div class="card-content">
        <div class="field"><label>Unidade</label><textarea id="dadosUnidade${suffix}" rows="1" class="auto-expand" placeholder="Digite a unidade" ${syncObj}></textarea></div>
        <div class="field"><label>Destino</label><textarea id="dadosDestino${suffix}" rows="1" class="auto-expand" placeholder="Digite o destino / comarca" list="destinosList" ${syncObj}></textarea></div>
        <datalist id="destinosList"></datalist>
        <div class="field"><label>Objetivo</label><textarea id="dadosObjetivo${suffix}" rows="1" class="auto-expand" placeholder="Digite o objetivo" ${syncObj}></textarea></div>
      </div>
    </div>`;
  },

  renderVeiculoSection(suffix) {
    const isEmp = suffix === '_emp';
    return `
    <div class="card ${isEmp ? 'emprestimo-card' : ''}" data-step="1">
      <h2 class="${isEmp ? 'emprestimo-title' : ''}"><span class="material-symbols-rounded section-icon">directions_car</span> DADOS DO VEÍCULO ${isEmp ? '(EMPRÉSTIMO)' : ''}</h2>
      <div class="search-box ${isEmp ? 'emprestimo-search' : ''}">
        <div class="field full-width">
          <label class="search-label"><span class="material-symbols-rounded">search</span> Placa do Veículo:</label>
          <input id="placaVeiculo${suffix}" class="search-input ${isEmp ? 'emprestimo-input' : ''}" placeholder="Ex: RCH1B48">
        </div>
      </div>
      <div class="grid">
        <div class="field"><label>Veículo / Nome</label><input id="veiculoNome${suffix}"></div>
        <div class="field"><label>Marca</label><input id="veiculoMarca${suffix}"></div>
        <div class="field"><label>Ano / Modelo</label><input id="veiculoAno${suffix}"></div>
        <div class="field"><label>Motor</label><input id="veiculoMotor${suffix}"></div>
        <div class="field"><label>KM</label><input id="veiculoKM${suffix}" type="number" inputmode="numeric"></div>
        <div class="field"><label>Cor</label><input id="veiculoCor${suffix}"></div>
      </div>
      <div class="grid mt-10">
        <div class="field"><label>Placa descaracterizada</label><input id="placaDescaracterizada${suffix}"></div>
      </div>
      <div class="fuel-box">
        <label class="${isEmp ? 'emprestimo-label' : ''}"><span class="material-symbols-rounded">local_gas_station</span> Nível do Combustível:</label>
        <div class="fuel-gauge ${isEmp ? 'emprestimo-gauge' : ''}">
          <div class="fuel-level" data-fuel="Vazio" data-suffix="${suffix}" onclick="ChecklistFormPage.selectFuel(this,'Vazio')">Vazio</div>
          <div class="fuel-level" data-fuel="1/4" data-suffix="${suffix}" onclick="ChecklistFormPage.selectFuel(this,'1/4')">¼</div>
          <div class="fuel-level" data-fuel="1/2" data-suffix="${suffix}" onclick="ChecklistFormPage.selectFuel(this,'1/2')">½</div>
          <div class="fuel-level" data-fuel="3/4" data-suffix="${suffix}" onclick="ChecklistFormPage.selectFuel(this,'3/4')">¾</div>
          <div class="fuel-level" data-fuel="Cheio" data-suffix="${suffix}" onclick="ChecklistFormPage.selectFuel(this,'Cheio')">Cheio</div>
        </div>
        <input type="hidden" id="valorCombustivel${suffix}">
      </div>

      <!-- Data/Hora auto-filled -->
      <div class="box ${isEmp ? 'emprestimo-box' : ''}">
        <h3><span class="material-symbols-rounded">schedule</span> Data e Hora</h3>
        <div class="grid mt-10">
          <div class="field"><label>Data</label><input type="date" id="movimentacaoData${suffix}"></div>
          <div class="field"><label>Hora</label><input type="time" id="movimentacaoHora${suffix}"></div>
        </div>
      </div>
    </div>`;
  },

  renderChecklistSection(suffix) {
    const isEmp = suffix === '_emp';
    return `
    <div class="card ${isEmp ? 'emprestimo-card' : ''}" data-step="2">
      <h2 class="${isEmp ? 'emprestimo-title' : ''}"><span class="material-symbols-rounded section-icon">fact_check</span> ITENS DO CHECKLIST ${isEmp ? '(EMPRÉSTIMO)' : ''}</h2>
      <div class="table-container">
        <table class="checklist-table">
          <thead><tr><th>ITEM</th><th>AVALIAÇÃO</th><th>DEFEITOS / STATUS</th></tr></thead>
          <tbody id="checklistBody${suffix}"></tbody>
        </table>
      </div>
      <div class="field mt-10">
        <label>Outros defeitos (inconformidades não listadas):</label>
        <textarea id="outrosDefeitos${suffix}" rows="2" placeholder="Descreva detalhadamente..."></textarea>
      </div>
    </div>`;
  },

  renderFotosSection(containerId, labelsOrCount, formId) {
    const isAvarias = typeof labelsOrCount === 'number';
    const titulo = isAvarias ? 'AVARIAS' : 'GERAIS';
    const isEmp = formId === 'emprestimo';
    return `
    <div class="card ${isEmp ? 'emprestimo-card' : ''}" data-step="3">
      <h2 class="${isEmp ? 'emprestimo-title' : ''}"><span class="material-symbols-rounded section-icon">photo_camera</span> FOTOS — ${titulo}</h2>
      <div class="photos" id="${containerId}"></div>
      ${isAvarias ? `<button type="button" class="btn btn-outline mt-10" onclick="ChecklistFormPage.adicionarCaixaAvaria('${containerId}', '${formId}')" style="width: 100%; border-style: dashed;"><span class="material-symbols-rounded">add_circle</span> Adicionar mais uma Avaria</button>` : ''}
    </div>`;
  },

  renderObsSection(suffix) {
    const isEmp = suffix === '_emp';
    const syncObj = !isEmp ? `oninput="ChecklistFormPage.syncField(this, '_emp')"` : '';
    
    return `
    <div class="card ${isEmp ? 'emprestimo-card' : ''}">
      <h2 class="${isEmp ? 'emprestimo-title' : ''}"><span class="material-symbols-rounded section-icon">edit_note</span> OBSERVAÇÕES</h2>
      <div class="field"><label>Observações Gerais</label><textarea id="obsGerais${suffix}" rows="3" ${syncObj}></textarea></div>
      <div class="field mt-10"><label>Serviços realizados</label><textarea id="servicosRealizados${suffix}" rows="3" ${syncObj}></textarea></div>
    </div>`;
  },

  async afterRender(params = {}) {
    // Build dynamic content
    this.buildChecklistTable('');
    this.buildPhotoGrid('geral-oficial', this.FOTOS_GERAIS, 'oficial');
    this.buildPhotoGrid('avarias-oficial', 3, 'oficial');

    if (this.modo === 'troca') {
      this.buildChecklistTable('_emp');
      this.buildPhotoGrid('geral-emprestimo', this.FOTOS_GERAIS, 'emprestimo');
      this.buildPhotoGrid('avarias-emprestimo', 3, 'emprestimo');
    }

    // Placa search
    this.setupPlacaSearch('placaVeiculo', '');
    if (this.modo === 'troca') this.setupPlacaSearch('placaVeiculo_emp', '_emp');

    // Auto-fill date/time
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().slice(0, 5);
    ['', '_emp'].forEach(s => {
      const dateEl = document.getElementById(`movimentacaoData${s}`);
      const timeEl = document.getElementById(`movimentacaoHora${s}`);
      if (dateEl && !dateEl.value) dateEl.value = dateStr;
      if (timeEl && !timeEl.value) timeEl.value = timeStr;
    });

    // Init signature
    if (typeof initSignature === 'function') initSignature();

    // Setup signature observers
    ['signaturePreview', 'signaturePreview_vistoriador'].forEach(id => {
      const sigPreview = document.getElementById(id);
      if (sigPreview) {
        const placeholder = sigPreview.nextElementSibling;
        const observer = new MutationObserver(mutations => {
          mutations.forEach(m => {
            if (m.attributeName === 'src') {
              if (sigPreview.src && sigPreview.src.startsWith('data:')) {
                placeholder.style.display = 'none';
                sigPreview.style.display = 'block';
              } else {
                placeholder.style.display = 'flex';
                sigPreview.style.display = 'none';
              }
            }
          });
        });
        observer.observe(sigPreview, { attributes: true });
      }
    });

    // Load destinos for autocomplete
    this.loadDestinos();

    // If resuming an existing checklist, load its data
    if (this.checklistId) {
      await this.loadExistingChecklist(this.checklistId);
    }

    // Restore form state if coming back from a camera/OS kill
    if (params._restoreState) {
      setTimeout(() => {
        this.applyRestoredState(params._restoreState);
      }, 300);
    }

    // Dirty tracking — marca formulário como alterado quando o usuário interagir
    setTimeout(() => {
      const form = document.querySelector('.main-content');
      if (form) {
        form.addEventListener('input', () => { this.isDirty = true; }, { once: false });
        form.addEventListener('change', () => { this.isDirty = true; }, { once: false });
      }
    }, 500);

    // Setup Stepper Observer
    const stepCards = document.querySelectorAll('.card[data-step]');
    if (stepCards.length > 0) {
      const observer = new IntersectionObserver((entries) => {
        let visibleSteps = [];
        document.querySelectorAll('.card[data-step]').forEach(card => {
          const rect = card.getBoundingClientRect();
          if (rect.top < window.innerHeight * 0.7 && rect.bottom > window.innerHeight * 0.3) {
            visibleSteps.push(parseInt(card.getAttribute('data-step'), 10));
          }
        });
        if (visibleSteps.length > 0) {
          const maxVisible = Math.max(...visibleSteps);
          this.updateStepper(maxVisible);
        }
      }, { rootMargin: '-10% 0px -50% 0px', threshold: [0, 0.25, 0.5] });
      
      stepCards.forEach(card => observer.observe(card));
    }
  },

  updateStepper(activeStep) {
    const steps = document.querySelectorAll('.stepper-step');
    const progressBar = document.getElementById('stepperProgressBar');
    if (!steps.length || !progressBar) return;
    
    steps.forEach((step, index) => {
      if (index < activeStep) {
        step.className = 'stepper-step completed';
        step.querySelector('.stepper-circle').innerHTML = '<span class="material-symbols-rounded" style="font-size:16px;">check</span>';
      } else if (index === activeStep) {
        step.className = 'stepper-step active';
        step.querySelector('.stepper-circle').innerHTML = (index + 1);
      } else {
        step.className = 'stepper-step';
        step.querySelector('.stepper-circle').innerHTML = (index + 1);
      }
    });

    const progress = (activeStep / (steps.length - 1)) * 100;
    progressBar.style.width = progress + '%';
  },

  navigateBack() {
    if (this.isDirty) {
      if (!confirm('Você tem alterações não salvas. Deseja realmente sair?')) return;
    }
    this.isDirty = false;
    window.onbeforeunload = null;
    // Clear saved state — user left intentionally
    sessionStorage.removeItem('tjgo_form_state');
    sessionStorage.removeItem('tjgo_pending_photo');
    App.navigate('dashboard');
  },

  async loadDestinos() {
    try {
      const destinos = await API.get('/checklists/destinos');
      const datalist = document.getElementById('destinosList');
      if (datalist && Array.isArray(destinos)) {
        datalist.innerHTML = destinos.map(d => `<option value="${d}">`).join('');
      }
    } catch { /* ignore */ }
  },

  async loadExistingChecklist(id) {
    try {
      App.showLoading('Carregando checklist...');
      const data = await API.get(`/checklists/${id}`);
      this.existingData = data;
      this.modo = data.tipo || 'simples';

      if (this.isRetomar) {
        if (data.saida_data && !data.entrada_data) {
          this.setFaseInicial('entrada');
        } else {
          this.setFaseInicial('saida');
        }
      }

      const prefix = (this.isEdit && this.fase === 'saida') || (this.isRetomar && this.fase === 'saida') ? 'saida' : 'entrada';

      // Fill vehicle data
      this.setVal('placaVeiculo', data.veiculo_placa);
      this.setVal('veiculoNome', data.veiculo_modelo);
      this.setVal('veiculoMarca', data.veiculo_marca);
      this.setVal('veiculoAno', data.veiculo_ano);
      this.setVal('veiculoMotor', data.veiculo_motor);
      this.setVal('veiculoCor', data.veiculo_cor);
      this.setVal('placaDescaracterizada', data.veiculo_placa_descaract);

      // Fill viagem
      this.setVal('dadosUnidade', data.unidade);
      this.setVal('dadosDestino', data.destino);
      this.setVal('dadosObjetivo', data.objetivo);

      // Fill condutor
      this.setVal('nomeCondutor', data.motorista_nome);
      this.setVal('cnhCondutor', data.motorista_cnh);

      // If resuming for saida, show entrada data as read-only info
      if (this.fase === 'saida' && data.entrada_km) {
        this.showEntradaResumo(data);
      }

      const populateChecklist = (fieldSuffix, dbPrefix) => {
        const cl = data[dbPrefix];
        if (cl && Array.isArray(cl)) {
          cl.forEach((item, i) => {
            if (item.avaliacao) {
              const grid = document.querySelector(`[data-item-idx="${i}"]${fieldSuffix ? `[id$="${fieldSuffix}"]` : ':not([id$="_emp"])'}`);
              if (grid) {
                const btns = grid.querySelectorAll('.check-btn');
                if (item.avaliacao === 'sim') btns[0].classList.add('active-sim');
                else if (item.avaliacao === 'nao') btns[1].classList.add('active-nao');
                else if (item.avaliacao === 'dan') { btns[2].classList.add('active-dan'); btns[0].classList.add('active-sim'); }
              }
            }
            if (item.defeito) {
              const sel = document.getElementById(`select-item-${i}${fieldSuffix}`);
              if (sel) sel.value = item.defeito;
            }
          });
        }
      };

      // Fill entry data checklist items
      populateChecklist('', `${prefix}_checklist`);
      if (this.modo === 'troca') {
        populateChecklist('_emp', `emp_${prefix}_checklist`);
      }

      // Fuel
      const comb = data[`${prefix}_combustivel`];
      if (comb) {
        const fuelEl = document.querySelector(`.fuel-level[data-fuel="${comb}"][data-suffix=""]`);
        if (fuelEl) fuelEl.classList.add('selected');
        this.setVal('valorCombustivel', comb);
      }
      if (this.modo === 'troca') {
        const combEmp = data[`emp_${prefix}_combustivel`];
        if (combEmp) {
          const fuelEl = document.querySelector(`.fuel-level[data-fuel="${combEmp}"][data-suffix="_emp"]`);
          if (fuelEl) fuelEl.classList.add('selected');
          this.setVal('valorCombustivel_emp', combEmp);
        }
      }

      // KM
      if (data[`${prefix}_km`]) this.setVal('veiculoKM', data[`${prefix}_km`]);
      if (this.modo === 'troca' && data[`emp_${prefix}_km`]) this.setVal('veiculoKM_emp', data[`emp_${prefix}_km`]);

      // Date/hora
      if (this.fase === 'saida' && !this.isEdit) {
        // Auto-fill saida date/hora with current for resuming
        const now = new Date();
        this.setVal('movimentacaoData', now.toISOString().split('T')[0]);
        this.setVal('movimentacaoHora', now.toTimeString().slice(0, 5));
        if (this.modo === 'troca') {
          this.setVal('movimentacaoData_emp', now.toISOString().split('T')[0]);
          this.setVal('movimentacaoHora_emp', now.toTimeString().slice(0, 5));
        }
      } else {
        this.setVal('movimentacaoData', data[`${prefix}_data`]);
        this.setVal('movimentacaoHora', data[`${prefix}_hora`]);
        if (this.modo === 'troca') {
          this.setVal('movimentacaoData_emp', data[`emp_${prefix}_data`]);
          this.setVal('movimentacaoHora_emp', data[`emp_${prefix}_hora`]);
        }
      }

      // Observations
      this.setVal('outrosDefeitos', data[`${prefix}_outros_defeitos`]);
      this.setVal('obsGerais', data[`${prefix}_obs`]);
      this.setVal('servicosRealizados', data[`${prefix}_servicos`]);
      if (this.modo === 'troca') {
        this.setVal('outrosDefeitos_emp', data[`emp_${prefix}_outros_defeitos`]);
        this.setVal('obsGerais_emp', data[`emp_${prefix}_obs`]);
        this.setVal('servicosRealizados_emp', data[`emp_${prefix}_servicos`]);
      }

      // Restore photos from server
      if (data.fotos && data.fotos.length > 0) {
        // Sort: entrada first, so saida overwrites if present
        const sortedFotos = [...data.fotos].sort((a, b) => {
          if (a.categoria.startsWith('entrada') && b.categoria.startsWith('saida')) return -1;
          if (a.categoria.startsWith('saida') && b.categoria.startsWith('entrada')) return 1;
          return 0;
        });

        sortedFotos.forEach(foto => {
          let cat = foto.categoria;
          let isCurrentPhase = true;
          let isFallback = false;

          if (cat.startsWith('entrada_') || cat.startsWith('saida_') || cat.startsWith('unico_')) {
            if (this.fase === 'saida' && cat.startsWith('entrada_')) {
              // We are in saida, and we found an entrada photo. Use it as fallback!
              isCurrentPhase = true;
              isFallback = true;
            } else if (!cat.startsWith(this.fase + '_') && !cat.startsWith('unico_')) {
              isCurrentPhase = false;
            }
            cat = cat.replace(/^(entrada|saida|unico)_/, '');
          } else {
             if (this.fase !== 'entrada' && !this.isRetomar) isCurrentPhase = false;
          }

          if (!isCurrentPhase) return;

          const container = document.getElementById(cat);
          if (!container) return;

          const boxes = container.querySelectorAll('.photo-box');
          let targetBox = null;
          boxes.forEach(box => {
            const label = box.querySelector('b');
            if (label && label.textContent === foto.label) {
              targetBox = box;
            }
          });

          if (!targetBox && cat.startsWith('avarias-')) {
            const formId = cat.includes('emprestimo') ? 'emprestimo' : 'oficial';
            const indexStr = foto.label.replace('Avaria ', '');
            const index = (parseInt(indexStr) || boxes.length + 1) - 1;
            targetBox = this.criarCaixaFoto(cat, formId, 'avaria', foto.label, index);
          }

          if (targetBox) {
            const img = targetBox.querySelector('img');
            if (img && foto.dados) {
              img.src = foto.dados;
              img.style.display = 'block';

              const fotoId = targetBox.getAttribute('data-foto-id');
              const targetContainerId = targetBox.getAttribute('data-container-id');
              
              // Add to captured so it gets saved correctly!
              const catDb = (this.fase || 'entrada') + '_' + targetContainerId;
              this.fotosCaptured[fotoId] = { categoria: catDb, label: foto.label, dados: foto.dados };

              // Adjust UI: Hide camera/gallery, show Remove
              const actions = targetBox.querySelectorAll('.photo-action-btn:not(.photo-remove-btn)');
              actions.forEach(a => a.style.display = 'none');
              const removeBtn = targetBox.querySelector('.photo-remove-btn');
              if (removeBtn) removeBtn.style.display = 'flex';
            }
          }
        });
      }

      // Restore signatures
      if (data[`${prefix}_assinatura`]) {
        const sigPreview = document.getElementById('signaturePreview');
        if (sigPreview) sigPreview.src = data[`${prefix}_assinatura`];
      }
      if (data[`${prefix}_assinatura_vistoriador`]) {
        const sigPreviewVist = document.getElementById('signaturePreview_vistoriador');
        if (sigPreviewVist) sigPreviewVist.src = data[`${prefix}_assinatura_vistoriador`];
      }

      App.hideLoading();
    } catch (err) {
      App.hideLoading();
      App.toast('Erro ao carregar checklist: ' + err.message, 'error');
    }
  },

  showEntradaResumo(data) {
    // Add an info card showing the entrada summary above the form
    const formOficial = document.getElementById('form-oficial');
    if (!formOficial) return;
    const resumo = document.createElement('div');
    resumo.className = 'card card-info';
    resumo.innerHTML = `
      <h2><span class="material-symbols-rounded section-icon">info</span> DADOS DO RECEBIMENTO (referência)</h2>
      <div class="info-grid">
        <div class="info-item"><span class="info-label">Data Recebimento</span><span class="info-value">${data.entrada_data || '—'}</span></div>
        <div class="info-item"><span class="info-label">Hora</span><span class="info-value">${data.entrada_hora || '—'}</span></div>
        <div class="info-item"><span class="info-label">KM Recebimento</span><span class="info-value">${data.entrada_km || '—'}</span></div>
        <div class="info-item"><span class="info-label">Combustível</span><span class="info-value">${data.entrada_combustivel || '—'}</span></div>
      </div>`;
    formOficial.insertBefore(resumo, formOficial.firstChild);
  },

  setVal(id, value) {
    const el = document.getElementById(id);
    if (el && value) el.value = value;
  },

  getVal(id) {
    const el = document.getElementById(id);
    return el ? el.value.trim() : '';
  },

  syncField(el, suffix) {
    if (this.modo !== 'troca') return;
    const targetId = el.id + suffix;
    const targetEl = document.getElementById(targetId);
    if (targetEl) {
      targetEl.value = el.value;
      if (targetEl.tagName === 'TEXTAREA') {
        targetEl.style.height = '';
        targetEl.style.height = targetEl.scrollHeight + 'px';
      }
    }
  },

  // Build checklist table
  buildChecklistTable(suffix) {
    const tbody = document.getElementById(`checklistBody${suffix}`);
    if (!tbody) return;

    this.ITENS_CHECKLIST.forEach((item, index) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${item}</td>
        <td>
          <div class="btn-grid" data-item-idx="${index}${suffix}">
            <button type="button" class="check-btn" onclick="ChecklistFormPage.marcarItem(this,'sim')" data-tipo="sim">SIM</button>
            <button type="button" class="check-btn" onclick="ChecklistFormPage.marcarItem(this,'nao')" data-tipo="nao">NÃO</button>
            <button type="button" class="check-btn" onclick="ChecklistFormPage.marcarItem(this,'dan')" data-tipo="dan">DANIF.</button>
          </div>
        </td>
        <td>
          <select id="select-item-${index}${suffix}">
            ${this.DEFEITOS_OPTIONS.map(d => `<option value="${d === 'Normal' ? '' : d}">${d}</option>`).join('')}
          </select>
        </td>`;
      tbody.appendChild(tr);
    });

    // Outros row
    const trOutro = document.createElement('tr');
    trOutro.innerHTML = `
      <td>Outros:<br><input type="text" id="outroItemNome${suffix}" placeholder="Descreva o item" style="margin-top:4px;font-size:12px;padding:6px;"></td>
      <td>
        <div class="btn-grid" data-item-idx="outro${suffix}">
          <button type="button" class="check-btn" onclick="ChecklistFormPage.marcarItem(this,'sim')" data-tipo="sim">SIM</button>
          <button type="button" class="check-btn" onclick="ChecklistFormPage.marcarItem(this,'nao')" data-tipo="nao">NÃO</button>
          <button type="button" class="check-btn" onclick="ChecklistFormPage.marcarItem(this,'dan')" data-tipo="dan">DANIF.</button>
        </div>
      </td>
      <td>
        <select id="select-item-outro${suffix}">
          ${this.DEFEITOS_OPTIONS.map(d => `<option value="${d === 'Normal' ? '' : d}">${d}</option>`).join('')}
        </select>
      </td>`;
    tbody.appendChild(trOutro);
  },

  buildPhotoGrid(containerId, labelsOrCount, formId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const isAvarias = typeof labelsOrCount === 'number';
    const count = isAvarias ? labelsOrCount : labelsOrCount.length;
    const prefix = isAvarias ? 'avaria' : 'geral';

    for (let i = 0; i < count; i++) {
      const label = isAvarias ? `Avaria ${i + 1}` : labelsOrCount[i];
      this.criarCaixaFoto(containerId, formId, prefix, label, i);
    }
  },

  adicionarCaixaAvaria(containerId, formId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const boxes = container.querySelectorAll('.photo-box');
    const index = boxes.length;
    const label = `Avaria ${index + 1}`;
    return this.criarCaixaFoto(containerId, formId, 'avaria', label, index);
  },

  criarCaixaFoto(containerId, formId, prefix, label, index) {
    const container = document.getElementById(containerId);
    const fotoId = `foto-${prefix}-${formId}-${index}`;
    const div = document.createElement('div');
    div.className = 'photo-box';
    div.setAttribute('data-foto-id', fotoId);
    div.setAttribute('data-container-id', containerId);
    div.setAttribute('data-label', label);

    div.innerHTML = `
      <b>${label}</b>
      <div class="photo-actions">
        <label class="btn btn-sm btn-outline photo-action-btn">
          <span class="material-symbols-rounded" style="font-size:16px!important;">photo_camera</span> Câmera
          <input type="file" accept="image/*" capture="environment" style="display:none;" data-foto-id="${fotoId}" data-container-id="${containerId}" data-label="${label}">
        </label>
        <label class="btn btn-sm btn-outline photo-action-btn">
          <span class="material-symbols-rounded" style="font-size:16px!important;">photo_library</span> Galeria
          <input type="file" accept="image/*" style="display:none;" data-foto-id="${fotoId}" data-container-id="${containerId}" data-label="${label}">
        </label>
        <button type="button" class="btn btn-sm btn-outline photo-action-btn photo-remove-btn" style="display:none; color: var(--red); border-color: var(--red);" onclick="ChecklistFormPage.removeFoto('${fotoId}')">
          <span class="material-symbols-rounded" style="font-size:16px!important;">delete</span> Remover
        </button>
      </div>
      <img alt="${label}">`;

    // Attach listeners to both inputs
    div.querySelectorAll('input[type="file"]').forEach(input => {
      // CLICK: fires BEFORE the camera/gallery opens — save state synchronously
      input.addEventListener('click', function() {
        ChecklistFormPage.saveFormStateToSession();
      });

      // CHANGE: fires AFTER the user took the photo or picked from gallery
      input.addEventListener('change', async function() {
        if (!this.files || !this.files[0]) return;

        const targetFotoId = this.getAttribute('data-foto-id');
        const targetContainerId = this.getAttribute('data-container-id');
        const targetLabel = this.getAttribute('data-label');

        // Show loading indicator
        const photoBox = document.querySelector(`[data-foto-id="${targetFotoId}"]`);
        let removeBtn = null;
        if (photoBox) {
          const actions = photoBox.querySelectorAll('.photo-action-btn:not(.photo-remove-btn)');
          actions.forEach(a => a.style.display = 'none');
          removeBtn = photoBox.querySelector('.photo-remove-btn');
          if (removeBtn) removeBtn.style.display = 'none';
        }

        App.showLoading('Processando imagem...');

        try {
          const compressed = await ChecklistFormPage.compressImageSafe(this.files[0]);

          // Update the photo box
          if (photoBox) {
            const img = photoBox.querySelector('img');
            if (img) {
              img.src = compressed;
              img.style.display = 'block';
            }
            // Restore the buttons, but hide camera/gallery and show Remove
            const actions = photoBox.querySelectorAll('.photo-action-btn:not(.photo-remove-btn)');
            actions.forEach(a => a.style.display = 'none');
            if (removeBtn) removeBtn.style.display = 'flex';
          }
          const catDb = (ChecklistFormPage.fase || 'entrada') + '_' + targetContainerId;
          ChecklistFormPage.fotosCaptured[targetFotoId] = { categoria: catDb, label: targetLabel, dados: compressed };
          ChecklistFormPage.isDirty = true;
        } catch (e) {
          console.error('Erro ao processar imagem:', e);
          App.toast('Erro ao processar imagem. Tente outra.', 'error');
          // Restore the camera/gallery buttons
          if (photoBox) {
            const actions = photoBox.querySelectorAll('.photo-action-btn:not(.photo-remove-btn)');
            actions.forEach(a => a.style.display = 'flex');
          }
        } finally {
          App.hideLoading();
          this.value = ''; // Reset input
        }
      });
    });

    container.appendChild(div);
    return div;
  },

  removeFoto(fotoId) {
    if (!confirm('Tem certeza que deseja remover esta foto?')) return;
    
    // Remove from captured
    delete this.fotosCaptured[fotoId];
    this.isDirty = true;

    // Reset UI
    const photoBox = document.querySelector(`[data-foto-id="${fotoId}"]`);
    if (photoBox) {
      const img = photoBox.querySelector('img');
      if (img) {
        img.src = '';
        img.style.display = 'none';
      }
      
      const cameraGalleryBtns = photoBox.querySelectorAll('.photo-action-btn:not(.photo-remove-btn)');
      cameraGalleryBtns.forEach(b => b.style.display = 'inline-flex');
      
      const removeBtn = photoBox.querySelector('.photo-remove-btn');
      if (removeBtn) removeBtn.style.display = 'none';
    }
  },

  // Ultra memory-safe image compression for mobile devices
  // Strategy: never load the full-resolution image into memory
  compressImageSafe(file) {
    return new Promise(async (resolve, reject) => {
      const MAX_DIMENSION = 1280; // Balanced cap for good quality
      const QUALITY = 0.85;      // Higher quality while still compressing

      try {
        // METHOD 1: createImageBitmap with resize (best — native, no full-res decode)
        if (window.createImageBitmap) {
          try {
            // Get dimensions without fully decoding the image
            const bmpOriginal = await createImageBitmap(file);
            const ow = bmpOriginal.width;
            const oh = bmpOriginal.height;
            bmpOriginal.close(); // Free immediately

            // Calculate target size
            let tw = ow, th = oh;
            if (tw > MAX_DIMENSION || th > MAX_DIMENSION) {
              if (tw > th) {
                th = Math.round(th * (MAX_DIMENSION / tw));
                tw = MAX_DIMENSION;
              } else {
                tw = Math.round(tw * (MAX_DIMENSION / th));
                th = MAX_DIMENSION;
              }
            }

            // Decode directly at target resolution (uses minimal RAM)
            const bmpResized = await createImageBitmap(file, {
              resizeWidth: tw,
              resizeHeight: th,
              resizeQuality: 'medium'
            });

            // Draw to canvas and export
            const canvas = document.createElement('canvas');
            canvas.width = tw;
            canvas.height = th;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(bmpResized, 0, 0);
            bmpResized.close(); // Free bitmap RAM

            const dataUrl = canvas.toDataURL('image/jpeg', QUALITY);

            // Nuke canvas to free memory
            canvas.width = 1;
            canvas.height = 1;

            resolve(dataUrl);
            return;
          } catch (e) {
            console.warn('createImageBitmap resize failed, trying fallback:', e);
          }
        }

        // METHOD 2: Classic Image + Canvas fallback (for older browsers)
        const objectUrl = URL.createObjectURL(file);
        const img = new Image();

        img.onload = function() {
          URL.revokeObjectURL(objectUrl); // Free blob URL

          let tw = img.width, th = img.height;
          if (tw > MAX_DIMENSION || th > MAX_DIMENSION) {
            if (tw > th) {
              th = Math.round(th * (MAX_DIMENSION / tw));
              tw = MAX_DIMENSION;
            } else {
              tw = Math.round(tw * (MAX_DIMENSION / th));
              th = MAX_DIMENSION;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = tw;
          canvas.height = th;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, tw, th);

          const dataUrl = canvas.toDataURL('image/jpeg', QUALITY);

          // Nuke canvas
          canvas.width = 1;
          canvas.height = 1;

          resolve(dataUrl);
        };

        img.onerror = function() {
          URL.revokeObjectURL(objectUrl);
          reject(new Error('Falha ao carregar imagem'));
        };

        img.src = objectUrl;

      } catch (err) {
        reject(err);
      }
    });
  },

  // Keep old method name as alias for any other code that calls it
  compressImage(file, maxWidth, quality) {
    return this.compressImageSafe(file);
  },

  // Mark checklist item
  marcarItem(btn, tipo) {
    const grid = btn.closest('.btn-grid');
    const btns = grid.querySelectorAll('.check-btn');
    btns.forEach(b => b.classList.remove('active-sim', 'active-nao', 'active-dan'));

    if (tipo === 'sim') btns[0].classList.add('active-sim');
    else if (tipo === 'nao') btns[1].classList.add('active-nao');
    else if (tipo === 'dan') { btns[2].classList.add('active-dan'); btns[0].classList.add('active-sim'); }
  },

  // Select fuel level
  selectFuel(el, valor) {
    const gauge = el.closest('.fuel-gauge');
    gauge.querySelectorAll('.fuel-level').forEach(b => b.classList.remove('selected'));
    el.classList.add('selected');
    const suffix = el.dataset.suffix || '';
    const hidden = document.getElementById(`valorCombustivel${suffix}`);
    if (hidden) hidden.value = valor;
  },

  // Setup placa search
  setupPlacaSearch(inputId, suffix) {
    const input = document.getElementById(inputId);
    if (!input) return;
    input.addEventListener('input', function () {
      ChecklistFormPage.buscarPlaca(this.value, suffix);
    });
  },

  buscarPlaca(placaDigitada, suffix) {
    const placa = placaDigitada.trim().toUpperCase();
    const fields = ['veiculoNome', 'veiculoMarca', 'veiculoAno', 'veiculoMotor', 'veiculoCor', 'placaDescaracterizada'];
    if (typeof BANCO_VEICULOS !== 'undefined' && BANCO_VEICULOS[placa]) {
      const v = BANCO_VEICULOS[placa];
      const vals = [v.modelo, v.marca, v.ano, v.motor, v.cor, v.descaracterizada];
      fields.forEach((f, i) => {
        const el = document.getElementById(f + suffix);
        if (el) el.value = vals[i];
      });
    }
  },

  alternarAba(aba) {
    const formOficial = document.getElementById('form-oficial');
    const formEmprestimo = document.getElementById('form-emprestimo');
    const btnOficial = document.getElementById('abaOficial');
    const btnEmprestimo = document.getElementById('abaEmprestimo');

    if (aba === 'oficial') {
      formOficial?.classList.remove('hidden');
      formEmprestimo?.classList.add('hidden');
      btnOficial?.classList.remove('inactive'); btnOficial?.classList.add('oficial');
      btnEmprestimo?.classList.add('inactive'); btnEmprestimo?.classList.remove('emprestimo');
    } else {
      formOficial?.classList.add('hidden');
      formEmprestimo?.classList.remove('hidden');
      btnOficial?.classList.add('inactive'); btnOficial?.classList.remove('oficial');
      btnEmprestimo?.classList.remove('inactive'); btnEmprestimo?.classList.add('emprestimo');
    }
  },

  toggleChecklistUnico(checked) {
    const aviso = document.getElementById('avisoChecklistUnico');
    const btnEntrada = document.getElementById('btnSalvarEntrada');
    const btnUnico = document.getElementById('btnSalvarUnico');
    if (aviso) aviso.style.display = checked ? 'block' : 'none';
    if (btnEntrada) btnEntrada.style.display = checked ? 'none' : 'inline-flex';
    if (btnUnico) btnUnico.style.display = checked ? 'inline-flex' : 'none';
  },

  // Collect all form data
  collectFormData(suffix = '') {
    const checklist = [];
    this.ITENS_CHECKLIST.forEach((item, i) => {
      const grid = document.querySelector(`[data-item-idx="${i}${suffix}"]`);
      let avaliacao = '';
      if (grid) {
        const btns = grid.querySelectorAll('.check-btn');
        if (btns[0].classList.contains('active-sim')) avaliacao = 'sim';
        if (btns[1].classList.contains('active-nao')) avaliacao = 'nao';
        if (btns[2].classList.contains('active-dan')) avaliacao = 'dan';
      }
      const defeito = this.getVal(`select-item-${i}${suffix}`);
      checklist.push({ item, avaliacao, defeito });
    });
    // Outros
    const outroNome = this.getVal(`outroItemNome${suffix}`);
    if (outroNome) {
      const grid = document.querySelector(`[data-item-idx="outro${suffix}"]`);
      let avaliacao = '';
      if (grid) {
        const btns = grid.querySelectorAll('.check-btn');
        if (btns[0].classList.contains('active-sim')) avaliacao = 'sim';
        if (btns[1].classList.contains('active-nao')) avaliacao = 'nao';
        if (btns[2].classList.contains('active-dan')) avaliacao = 'dan';
      }
      checklist.push({ item: outroNome, avaliacao, defeito: this.getVal(`select-item-outro${suffix}`) });
    }
    return checklist;
  },

  // CHECKLIST ÚNICO (Entrada e Saída simultâneas)
  async salvarUnico() {
    const placa = this.getVal('placaVeiculo');
    if (!placa) { App.toast('Preencha a placa do veículo', 'warning'); return; }

    App.showLoading('Salvando Checklist Único...');

    const baseData = {
      tipo: this.modo,
      veiculo_placa: placa,
      veiculo_modelo: this.getVal('veiculoNome'),
      veiculo_marca: this.getVal('veiculoMarca'),
      veiculo_ano: this.getVal('veiculoAno'),
      veiculo_motor: this.getVal('veiculoMotor'),
      veiculo_cor: this.getVal('veiculoCor'),
      veiculo_placa_descaract: this.getVal('placaDescaracterizada'),
      unidade: this.getVal('dadosUnidade'),
      destino: this.getVal('dadosDestino'),
      objetivo: this.getVal('dadosObjetivo'),
      motorista_nome: this.getVal('nomeCondutor'),
      motorista_cnh: this.getVal('cnhCondutor')
    };

    const movData = {
      data: this.getVal('movimentacaoData') || null,
      hora: this.getVal('movimentacaoHora') || null,
      combustivel: this.getVal('valorCombustivel'),
      km: this.getVal('veiculoKM'),
      checklist: this.collectFormData(''),
      outros_defeitos: this.getVal('outrosDefeitos'),
      obs: this.getVal('obsGerais'),
      servicos: this.getVal('servicosRealizados'),
      assinatura: document.getElementById('signaturePreview')?.src?.startsWith('data:') ? document.getElementById('signaturePreview').src : null,
      assinatura_vistoriador: document.getElementById('signaturePreview_vistoriador')?.src?.startsWith('data:') ? document.getElementById('signaturePreview_vistoriador').src : null
    };

    const data = {
      ...baseData,
      status: 'concluido',
      // Entrada
      entrada_data: movData.data, entrada_hora: movData.hora, entrada_combustivel: movData.combustivel,
      entrada_km: movData.km, entrada_checklist: movData.checklist, entrada_outros_defeitos: movData.outros_defeitos,
      entrada_obs: movData.obs, entrada_servicos: movData.servicos, entrada_assinatura: movData.assinatura,
      entrada_assinatura_vistoriador: movData.assinatura_vistoriador,
      // Saida (same values)
      saida_data: movData.data, saida_hora: movData.hora, saida_combustivel: movData.combustivel,
      saida_km: movData.km, saida_checklist: movData.checklist, saida_outros_defeitos: movData.outros_defeitos,
      saida_obs: movData.obs, saida_servicos: movData.servicos, saida_assinatura: movData.assinatura,
      saida_assinatura_vistoriador: movData.assinatura_vistoriador
    };

    // Empréstimo data if troca mode
    if (this.modo === 'troca') {
      const empMovData = {
        data: this.getVal('movimentacaoData_emp') || null,
        hora: this.getVal('movimentacaoHora_emp') || null,
        combustivel: this.getVal('valorCombustivel_emp'),
        km: this.getVal('veiculoKM_emp'),
        checklist: this.collectFormData('_emp'),
        outros_defeitos: this.getVal('outrosDefeitos_emp'),
        obs: this.getVal('obsGerais_emp'),
        servicos: this.getVal('servicosRealizados_emp'),
        assinatura: movData.assinatura, // reuse signature
        assinatura_vistoriador: movData.assinatura_vistoriador
      };

      data.emp_placa = this.getVal('placaVeiculo_emp');
      data.emp_modelo = this.getVal('veiculoNome_emp');
      data.emp_marca = this.getVal('veiculoMarca_emp');
      data.emp_ano = this.getVal('veiculoAno_emp');
      data.emp_motor = this.getVal('veiculoMotor_emp');
      data.emp_cor = this.getVal('veiculoCor_emp');
      data.emp_placa_descaract = this.getVal('placaDescaracterizada_emp');
      
      data.emp_entrada_data = empMovData.data; data.emp_entrada_hora = empMovData.hora; data.emp_entrada_combustivel = empMovData.combustivel;
      data.emp_entrada_km = empMovData.km; data.emp_entrada_checklist = empMovData.checklist; data.emp_entrada_outros_defeitos = empMovData.outros_defeitos;
      data.emp_entrada_obs = empMovData.obs; data.emp_entrada_servicos = empMovData.servicos; data.emp_entrada_assinatura = empMovData.assinatura;
      data.emp_entrada_assinatura_vistoriador = empMovData.assinatura_vistoriador;

      data.emp_saida_data = empMovData.data; data.emp_saida_hora = empMovData.hora; data.emp_saida_combustivel = empMovData.combustivel;
      data.emp_saida_km = empMovData.km; data.emp_saida_checklist = empMovData.checklist; data.emp_saida_outros_defeitos = empMovData.outros_defeitos;
      data.emp_saida_obs = empMovData.obs; data.emp_saida_servicos = empMovData.servicos; data.emp_saida_assinatura = empMovData.assinatura;
      data.emp_saida_assinatura_vistoriador = empMovData.assinatura_vistoriador;
    }

    try {
      if (navigator.onLine) {
        let result;
        if (this.checklistId) {
          result = await API.put(`/checklists/${this.checklistId}`, data);
        } else {
          result = await API.post('/checklists', data);
        }

        // Save photos
        const fotos = Object.values(this.fotosCaptured);
        if (fotos.length > 0) {
          // Change category in memory to 'unico_' for unico saves
          fotos.forEach(f => {
            f.categoria = f.categoria.replace(/^(entrada|saida)_/, 'unico_');
          });
          await API.post(`/checklists/${result.id}/fotos?fase=unico`, { fotos });
        }

        App.hideLoading();
        App.toast('Checklist Único concluído com sucesso!', 'success');
        App.navigate('dashboard');
      } else {
        const localId = await LocalDB.saveChecklistOffline(data);
        await LocalDB.queueSync({
          type: this.checklistId ? 'update_checklist' : 'create_checklist',
          data, localId, serverId: this.checklistId, fotos: Object.values(this.fotosCaptured),
          fase: 'unico'
        });
        App.hideLoading();
        App.toast('Salvo offline — será sincronizado em breve', 'warning');
        App.navigate('dashboard');
      }
    } catch (err) {
      App.hideLoading();
      App.toast('Erro ao salvar: ' + err.message, 'error');
    }
  },

  // SAVE ENTRADA
  async salvarEntrada(concluir = false) {
    const placa = this.getVal('placaVeiculo');
    if (!placa) { App.toast('Preencha a placa do veículo', 'warning'); return; }

    App.showLoading('Salvando...');

    let novoStatus = 'em_andamento';
    if (this.existingData && this.existingData.status === 'concluido') {
      novoStatus = 'concluido';
    } else if (concluir) {
      novoStatus = 'concluido';
    }

    const data = {
      status: novoStatus,
      tipo: this.modo,
      veiculo_placa: placa,
      veiculo_modelo: this.getVal('veiculoNome'),
      veiculo_marca: this.getVal('veiculoMarca'),
      veiculo_ano: this.getVal('veiculoAno'),
      veiculo_motor: this.getVal('veiculoMotor'),
      veiculo_cor: this.getVal('veiculoCor'),
      veiculo_placa_descaract: this.getVal('placaDescaracterizada'),
      unidade: this.getVal('dadosUnidade'),
      destino: this.getVal('dadosDestino'),
      objetivo: this.getVal('dadosObjetivo'),
      motorista_nome: this.getVal('nomeCondutor'),
      motorista_cnh: this.getVal('cnhCondutor'),
      entrada_data: this.getVal('movimentacaoData') || null,
      entrada_hora: this.getVal('movimentacaoHora') || null,
      entrada_combustivel: this.getVal('valorCombustivel'),
      entrada_km: this.getVal('veiculoKM'),
      entrada_checklist: this.collectFormData(''),
      entrada_outros_defeitos: this.getVal('outrosDefeitos'),
      entrada_obs: this.getVal('obsGerais'),
      entrada_servicos: this.getVal('servicosRealizados'),
      entrada_assinatura: document.getElementById('signaturePreview')?.src?.startsWith('data:') ? document.getElementById('signaturePreview').src : null,
      entrada_assinatura_vistoriador: document.getElementById('signaturePreview_vistoriador')?.src?.startsWith('data:') ? document.getElementById('signaturePreview_vistoriador').src : null
    };

    // Empréstimo data if troca mode
    if (this.modo === 'troca') {
      data.emp_placa = this.getVal('placaVeiculo_emp');
      data.emp_modelo = this.getVal('veiculoNome_emp');
      data.emp_marca = this.getVal('veiculoMarca_emp');
      data.emp_ano = this.getVal('veiculoAno_emp');
      data.emp_motor = this.getVal('veiculoMotor_emp');
      data.emp_cor = this.getVal('veiculoCor_emp');
      data.emp_placa_descaract = this.getVal('placaDescaracterizada_emp');
      data.emp_entrada_data = this.getVal('movimentacaoData_emp') || null;
      data.emp_entrada_hora = this.getVal('movimentacaoHora_emp') || null;
      data.emp_entrada_combustivel = this.getVal('valorCombustivel_emp');
      data.emp_entrada_km = this.getVal('veiculoKM_emp');
      data.emp_entrada_checklist = this.collectFormData('_emp');
      data.emp_entrada_outros_defeitos = this.getVal('outrosDefeitos_emp');
      data.emp_entrada_obs = this.getVal('obsGerais_emp');
      data.emp_entrada_servicos = this.getVal('servicosRealizados_emp');
      data.emp_entrada_assinatura = data.entrada_assinatura;
      data.emp_entrada_assinatura_vistoriador = data.entrada_assinatura_vistoriador;
    }

    try {
      if (navigator.onLine) {
        let result;
        if (this.checklistId) {
          result = await API.put(`/checklists/${this.checklistId}`, data);
        } else {
          result = await API.post('/checklists', data);
        }

        // Save photos
        const fotos = Object.values(this.fotosCaptured);
        if (fotos.length > 0) {
          await API.post(`/checklists/${result.id}/fotos`, { fotos });
        }

        App.hideLoading();
        App.toast(this.isRetomar || (this.existingData && this.existingData.status === 'concluido') ? 'Checklist salvo!' : 'Checklist salvo como Em Andamento!', 'success');
        App.navigate('dashboard');
      } else {
        // Offline save
        const localId = await LocalDB.saveChecklistOffline(data);
        await LocalDB.queueSync({
          type: this.checklistId ? 'update_checklist' : 'create_checklist',
          data,
          localId,
          serverId: this.checklistId,
          fotos: Object.values(this.fotosCaptured),
          fase: this.fase
        });
        App.hideLoading();
        App.toast('Salvo offline — será sincronizado quando houver conexão', 'warning');
        App.navigate('dashboard');
      }
    } catch (err) {
      App.hideLoading();
      App.toast('Erro ao salvar: ' + err.message, 'error');
    }
  },

  // SAVE SAÍDA (conclude)
  async salvarSaida(concluir = false) {
    const placa = this.getVal('placaVeiculo');
    if (!placa && !this.checklistId) { App.toast('Preencha a placa do veículo', 'warning'); return; }

    App.showLoading('Salvando...');

    let novoStatus = 'em_andamento';
    if (this.existingData && this.existingData.status === 'concluido') {
      novoStatus = 'concluido';
    } else if (concluir) {
      novoStatus = 'concluido';
    }

    const data = {
      status: novoStatus,
      tipo: this.modo,
      saida_data: this.getVal('movimentacaoData') || null,
      saida_hora: this.getVal('movimentacaoHora') || null,
      saida_combustivel: this.getVal('valorCombustivel'),
      saida_km: this.getVal('veiculoKM'),
      saida_checklist: this.collectFormData(''),
      saida_outros_defeitos: this.getVal('outrosDefeitos'),
      saida_obs: this.getVal('obsGerais'),
      saida_servicos: this.getVal('servicosRealizados'),
      saida_assinatura: document.getElementById('signaturePreview')?.src?.startsWith('data:') ? document.getElementById('signaturePreview').src : null,
      saida_assinatura_vistoriador: document.getElementById('signaturePreview_vistoriador')?.src?.startsWith('data:') ? document.getElementById('signaturePreview_vistoriador').src : null,
      motorista_nome: this.getVal('nomeCondutor'),
      motorista_cnh: this.getVal('cnhCondutor')
    };

    if (!this.checklistId) {
      data.veiculo_placa = placa;
      data.veiculo_modelo = this.getVal('veiculoNome');
      data.veiculo_marca = this.getVal('veiculoMarca');
      data.veiculo_ano = this.getVal('veiculoAno');
      data.veiculo_motor = this.getVal('veiculoMotor');
      data.veiculo_cor = this.getVal('veiculoCor');
      data.veiculo_placa_descaract = this.getVal('placaDescaracterizada');
      data.unidade = this.getVal('dadosUnidade');
      data.destino = this.getVal('dadosDestino');
      data.objetivo = this.getVal('dadosObjetivo');
    }

    if (this.modo === 'troca') {
      data.emp_saida_data = this.getVal('movimentacaoData_emp') || null;
      data.emp_saida_hora = this.getVal('movimentacaoHora_emp') || null;
      data.emp_saida_combustivel = this.getVal('valorCombustivel_emp');
      data.emp_saida_km = this.getVal('veiculoKM_emp');
      data.emp_saida_checklist = this.collectFormData('_emp');
      data.emp_saida_outros_defeitos = this.getVal('outrosDefeitos_emp');
      data.emp_saida_obs = this.getVal('obsGerais_emp');
      data.emp_saida_servicos = this.getVal('servicosRealizados_emp');
      data.emp_saida_assinatura = data.saida_assinatura;
      data.emp_saida_assinatura_vistoriador = data.saida_assinatura_vistoriador;
      
      if (!this.checklistId) {
        data.emp_placa = this.getVal('placaVeiculo_emp');
        data.emp_modelo = this.getVal('veiculoNome_emp');
        data.emp_marca = this.getVal('veiculoMarca_emp');
        data.emp_ano = this.getVal('veiculoAno_emp');
        data.emp_motor = this.getVal('veiculoMotor_emp');
        data.emp_cor = this.getVal('veiculoCor_emp');
        data.emp_placa_descaract = this.getVal('placaDescaracterizada_emp');
      }
    }

    try {
      if (navigator.onLine) {
        let result;
        if (this.checklistId) {
          result = await API.put(`/checklists/${this.checklistId}`, data);
        } else {
          result = await API.post('/checklists', data);
        }

        const fotos = Object.values(this.fotosCaptured);
        if (fotos.length > 0) {
          await API.post(`/checklists/${result.id || this.checklistId}/fotos?fase=${this.fase}`, { fotos });
        }

        App.hideLoading();
        App.toast(this.checklistId ? 'Checklist salvo!' : 'Checklist salvo como Em Andamento!', 'success');
        App.navigate('dashboard');
      } else {
        // Offline
        const localId = await LocalDB.saveChecklistOffline(data);
        await LocalDB.queueSync({
          type: this.checklistId ? 'update_checklist' : 'create_checklist',
          data, localId, serverId: this.checklistId, fotos: Object.values(this.fotosCaptured),
          fase: this.fase
        });
        App.hideLoading();
        App.toast('Salvo offline', 'warning');
        App.navigate('dashboard');
      }
    } catch (err) {
      App.hideLoading();
      App.toast('Erro ao concluir: ' + err.message, 'error');
    }
  },

  async gerarPDF(tipoVeiculo) {
    if (typeof gerarPDFCompleto === 'function') {
      await gerarPDFCompleto(tipoVeiculo, this);
    }
  }
};
