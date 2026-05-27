// ============================================
// APP.JS - Main application logic
// ============================================

// State
let modoAtual = 'simples'; // 'simples' or 'troca'
let abaAtiva = 'oficial';  // 'oficial' or 'emprestimo'

const ITENS_CHECKLIST = [
  'Óleo', 'Arrefecimento', 'Bateria', 'Pneus', 'Rodas', 'Tapetes',
  'Extintor', 'Som', 'Vidros elétricos', 'Manual', 'Documentos Detran',
  'Chave reserva', 'Cartão de abastecimento', 'Chave de roda', 'Macaco',
  'Triângulo', 'Estepe'
];

const DEFEITOS_OPTIONS = ['Normal', 'Rasgado', 'Quebrado', 'Papo', 'Furado', 'Estragado', 'Baixo'];

const FOTOS_GERAIS = [
  'Frente', 'Coluna Dianteira Esquerda', 'Lado Esquerdo',
  'Coluna Traseira Esquerda', 'Coluna Dianteira Direita',
  'Coluna Traseira Direita', 'Lado Direito', 'Traseira', 'Painel'
];

const VISTORIADORES = {
  'Fernando': { nome: 'FERNANDO LACERDA SILVA', matricula: '5055920' },
  'Vinicius': { nome: 'VINICIUS TALES AZEVEDO COSTA', matricula: '02588' },
  'Jordana': { nome: 'JORDANA FERNANDES RODRIGUES DE SOUSA', matricula: '02363' }
};

// ============================================
// INITIALIZATION
// ============================================
window.addEventListener('DOMContentLoaded', async () => {
  await initDB();
  
  // Build dynamic content for both forms
  buildChecklistTable('oficial');
  buildChecklistTable('emprestimo');
  buildPhotoGrid('geral-oficial', FOTOS_GERAIS, 'oficial');
  buildPhotoGrid('avarias-oficial', 15, 'oficial');
  buildPhotoGrid('geral-emprestimo', FOTOS_GERAIS, 'emprestimo');
  buildPhotoGrid('avarias-emprestimo', 15, 'emprestimo');

  // Restore saved state
  restaurarCamposSalvos();
  restaurarBotoesChecklist('oficial');
  restaurarBotoesChecklist('emprestimo');
  restaurarCombustivel('oficial');
  restaurarCombustivel('emprestimo');
  restaurarAssinatura();
  restaurarModo();

  // Setup colors for Entrada/Saída
  setupCorMovimentacao('movimentacaoTipo');
  setupCorMovimentacao('movimentacaoTipo_emp');

  // Activate auto-save
  ativarAutoSave();

  // Init signature
  initSignature();

  // Init vistoriador logic
  initVistoriador();
  
  // Setup placa search for both forms
  setupPlacaSearch('placaVeiculo', '');
  setupPlacaSearch('placaVeiculo_emp', '_emp');
});

// ============================================
// CHECKLIST TABLE BUILDER
// ============================================
function buildChecklistTable(formId) {
  const tbody = document.getElementById(`checklistBody-${formId}`);
  if (!tbody) return;

  const suffix = formId === 'emprestimo' ? '_emp' : '';

  ITENS_CHECKLIST.forEach((item, index) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${item}</td>
      <td>
        <div class="btn-grid" data-item-idx="${index}${suffix}">
          <button type="button" class="check-btn" onclick="marcarItem(this, 'sim')" data-tipo="sim">SIM</button>
          <button type="button" class="check-btn" onclick="marcarItem(this, 'nao')" data-tipo="nao">NÃO</button>
          <button type="button" class="check-btn" onclick="marcarItem(this, 'dan')" data-tipo="dan">DANIF.</button>
        </div>
      </td>
      <td>
        <select id="select-item-${index}${suffix}" class="save-state">
          ${DEFEITOS_OPTIONS.map(d => `<option value="${d === 'Normal' ? '' : d}">${d}</option>`).join('')}
        </select>
      </td>
    `;
    tbody.appendChild(tr);
  });

  // "Outros" row
  const trOutro = document.createElement('tr');
  trOutro.innerHTML = `
    <td>Outros:<br><input type="text" id="outroItemNome${suffix}" class="save-state" placeholder="Descreva o item" style="margin-top:4px;font-size:12px;padding:6px;"></td>
    <td>
      <div class="btn-grid" data-item-idx="outro${suffix}">
        <button type="button" class="check-btn" onclick="marcarItem(this, 'sim')" data-tipo="sim">SIM</button>
        <button type="button" class="check-btn" onclick="marcarItem(this, 'nao')" data-tipo="nao">NÃO</button>
        <button type="button" class="check-btn" onclick="marcarItem(this, 'dan')" data-tipo="dan">DANIF.</button>
      </div>
    </td>
    <td>
      <select id="select-item-outro${suffix}" class="save-state">
        ${DEFEITOS_OPTIONS.map(d => `<option value="${d === 'Normal' ? '' : d}">${d}</option>`).join('')}
      </select>
    </td>
  `;
  tbody.appendChild(trOutro);
}

// ============================================
// PHOTO GRID BUILDER
// ============================================
function buildPhotoGrid(containerId, labels, formId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const isAvarias = typeof labels === 'number';
  const count = isAvarias ? labels : labels.length;
  const prefix = isAvarias ? 'avaria' : 'geral';

  for (let i = 0; i < count; i++) {
    const label = isAvarias ? `Avaria ${i + 1}` : labels[i];
    const fotoId = `foto-${prefix}-${formId}-${i}`;
    
    const div = document.createElement('div');
    div.className = 'photo-box';
    div.innerHTML = `<b>${label}</b><input type="file" accept="image/*" capture="environment" style="margin-top:5px;font-size:11px;"><img alt="${label}">`;

    const input = div.querySelector('input');
    const img = div.querySelector('img');

    input.addEventListener('change', function() {
      if (this.files && this.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
          // Compress image before saving
          comprimirImagem(e.target.result, 800, 0.7).then(compressed => {
            img.src = compressed;
            img.style.display = 'block';
            salvarFoto(fotoId, compressed);
          });
        };
        reader.readAsDataURL(this.files[0]);
      }
    });

    // Restore saved photo
    obterFoto(fotoId).then(savedData => {
      if (savedData) {
        img.src = savedData;
        img.style.display = 'block';
      }
    });

    container.appendChild(div);
  }
}

// ============================================
// IMAGE COMPRESSION
// ============================================
function comprimirImagem(base64, maxWidth, quality) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = function() {
      const canvas = document.createElement('canvas');
      let w = img.width, h = img.height;
      if (w > maxWidth) {
        h = h * (maxWidth / w);
        w = maxWidth;
      }
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => resolve(base64);
    img.src = base64;
  });
}

// ============================================
// CHECKLIST BUTTONS (SIM/NÃO/DANIF)
// ============================================
function marcarItem(botao, tipo) {
  const grid = botao.closest('.btn-grid');
  const btns = grid.querySelectorAll('.check-btn');
  const idx = grid.getAttribute('data-item-idx');

  const btnSim = btns[0], btnNao = btns[1], btnDan = btns[2];

  // Reset all first
  btnSim.classList.remove('active-sim'); btnSim.textContent = 'SIM';
  btnNao.classList.remove('active-nao'); btnNao.textContent = 'NÃO';
  btnDan.classList.remove('active-dan'); btnDan.textContent = 'DANIF.';

  if (tipo === 'sim') {
    const wasActive = obterCampo(`btn-${idx}`) === 'sim';
    if (!wasActive) {
      btnSim.classList.add('active-sim'); btnSim.textContent = '✔ V';
      salvarCampo(`btn-${idx}`, 'sim');
    } else {
      localStorage.removeItem(`btn-${idx}`);
    }
  } else if (tipo === 'nao') {
    const wasActive = obterCampo(`btn-${idx}`) === 'nao';
    if (!wasActive) {
      btnNao.classList.add('active-nao'); btnNao.textContent = '✖ X';
      salvarCampo(`btn-${idx}`, 'nao');
    } else {
      localStorage.removeItem(`btn-${idx}`);
    }
  } else if (tipo === 'dan') {
    const wasActive = obterCampo(`btn-${idx}`) === 'dan';
    if (!wasActive) {
      btnDan.classList.add('active-dan'); btnDan.textContent = '⚠ D';
      btnSim.classList.add('active-sim'); btnSim.textContent = '✔ V';
      salvarCampo(`btn-${idx}`, 'dan');
    } else {
      localStorage.removeItem(`btn-${idx}`);
    }
  }
}

function restaurarBotoesChecklist(formId) {
  const suffix = formId === 'emprestimo' ? '_emp' : '';
  document.querySelectorAll(`#form-${formId} .btn-grid`).forEach(grid => {
    const idx = grid.getAttribute('data-item-idx');
    const status = obterCampo(`btn-${idx}`);
    if (!status) return;
    const btns = grid.querySelectorAll('.check-btn');
    if (status === 'sim') { btns[0].classList.add('active-sim'); btns[0].textContent = '✔ V'; }
    else if (status === 'nao') { btns[1].classList.add('active-nao'); btns[1].textContent = '✖ X'; }
    else if (status === 'dan') {
      btns[2].classList.add('active-dan'); btns[2].textContent = '⚠ D';
      btns[0].classList.add('active-sim'); btns[0].textContent = '✔ V';
    }
  });
}

// ============================================
// FUEL GAUGE
// ============================================
function selecionarCombustivel(el, valor, formId) {
  const suffix = formId === 'emprestimo' ? '_emp' : '';
  const gauge = el.closest('.fuel-gauge');
  gauge.querySelectorAll('.fuel-level').forEach(b => b.classList.remove('selected'));
  el.classList.add('selected');
  const hidden = document.getElementById(`valorCombustivel${suffix}`);
  if (hidden) hidden.value = valor;
  salvarCampo(`valorCombustivel${suffix}`, valor);
}

function restaurarCombustivel(formId) {
  const suffix = formId === 'emprestimo' ? '_emp' : '';
  const val = obterCampo(`valorCombustivel${suffix}`);
  if (val) {
    const el = document.querySelector(`#form-${formId} .fuel-level[data-fuel="${val}"]`);
    if (el) el.classList.add('selected');
  }
}

// ============================================
// PLACA SEARCH
// ============================================
function setupPlacaSearch(inputId, suffix) {
  const input = document.getElementById(inputId);
  if (!input) return;
  input.addEventListener('input', function() {
    buscarPlaca(this.value, suffix);
  });
}

function buscarPlaca(placaDigitada, suffix) {
  const placa = placaDigitada.trim().toUpperCase();
  const fields = ['veiculoNome', 'veiculoMarca', 'veiculoAno', 'veiculoMotor', 'veiculoCor', 'placaDescaracterizada'];

  if (typeof BANCO_VEICULOS !== 'undefined' && BANCO_VEICULOS[placa]) {
    const v = BANCO_VEICULOS[placa];
    const vals = [v.modelo, v.marca, v.ano, v.motor, v.cor, v.descaracterizada];
    fields.forEach((f, i) => {
      const el = document.getElementById(f + suffix);
      if (el) { el.value = vals[i]; salvarCampo(f + suffix, vals[i]); }
    });
  } else {
    fields.forEach(f => {
      const el = document.getElementById(f + suffix);
      if (el) el.value = '';
    });
  }
}

// ============================================
// VISTORIADOR LOGIC
// ============================================
function initVistoriador() {
  const seletor = document.getElementById('seletorVistoriador');
  if (!seletor) return;
  
  // Restore saved value and trigger update
  const saved = obterCampo('seletorVistoriador');
  if (saved) {
    seletor.value = saved;
    atualizarVistoriador(saved);
  }
}

function atualizarVistoriador(valor) {
  const camposManuais = document.getElementById('camposManuaisVistoriador');
  const txtNome = document.getElementById('nomeVistoriador');
  const txtMatricula = document.getElementById('matriculaVistoriador');
  if (!camposManuais || !txtNome || !txtMatricula) return;

  if (VISTORIADORES[valor]) {
    camposManuais.style.display = 'none';
    txtNome.value = VISTORIADORES[valor].nome;
    txtMatricula.value = VISTORIADORES[valor].matricula;
    salvarCampo('nomeVistoriador', txtNome.value);
    salvarCampo('matriculaVistoriador', txtMatricula.value);
  } else if (valor === 'Outro') {
    camposManuais.style.display = 'flex';
    txtNome.value = obterCampo('nomeVistoriador') || '';
    txtMatricula.value = obterCampo('matriculaVistoriador') || '';
    txtNome.focus();
  } else {
    camposManuais.style.display = 'none';
    txtNome.value = '';
    txtMatricula.value = '';
  }
}

// ============================================
// OPERATION MODE
// ============================================
function setModo(modo) {
  modoAtual = modo;
  salvarCampo('modoOperacao', modo);

  const btnSimples = document.getElementById('btnModoSimples');
  const btnDuplo = document.getElementById('btnModoDuplo');
  const abas = document.getElementById('abasControle');
  const formOficial = document.getElementById('form-oficial');
  const formEmprestimo = document.getElementById('form-emprestimo');
  const pdfSimples = document.getElementById('pdfBtnSimples');
  const pdfDuplo = document.getElementById('pdfBtnsDuplo');

  if (modo === 'simples') {
    btnSimples.classList.remove('inactive');
    btnSimples.classList.add('simples');
    btnDuplo.classList.add('inactive');
    btnDuplo.classList.remove('duplo');
    abas.style.display = 'none';
    formOficial.classList.remove('hidden');
    formEmprestimo.classList.add('hidden');
    pdfSimples.classList.remove('hidden');
    pdfDuplo.classList.add('hidden');
    document.getElementById('tituloChecklist').textContent = 'CHECKLIST VEICULAR';
  } else {
    btnSimples.classList.add('inactive');
    btnSimples.classList.remove('simples');
    btnDuplo.classList.remove('inactive');
    btnDuplo.classList.add('duplo');
    abas.style.display = 'flex';
    pdfSimples.classList.add('hidden');
    pdfDuplo.classList.remove('hidden');
    alternarAba(abaAtiva);
    copiarDadosParaEmprestimo();
  }
}

function copiarDadosParaEmprestimo() {
  const campos = [
    { from: 'dadosUnidade', to: 'dadosUnidade_emp' },
    { from: 'dadosDestino', to: 'dadosDestino_emp' },
    { from: 'dadosObjetivo', to: 'dadosObjetivo_emp' },
    { from: 'placaVeiculo', to: 'placaVeiculo_emp' },
    { from: 'veiculoNome', to: 'veiculoNome_emp' },
    { from: 'veiculoMarca', to: 'veiculoMarca_emp' },
    { from: 'veiculoAno', to: 'veiculoAno_emp' },
    { from: 'veiculoMotor', to: 'veiculoMotor_emp' },
    { from: 'veiculoKM', to: 'veiculoKM_emp' },
    { from: 'veiculoCor', to: 'veiculoCor_emp' },
    { from: 'placaDescaracterizada', to: 'placaDescaracterizada_emp' }
  ];

  campos.forEach(c => {
    const elFrom = document.getElementById(c.from);
    const elTo = document.getElementById(c.to);
    // Só copia se o destino estiver vazio e o original tiver valor
    if (elFrom && elTo && !elTo.value && elFrom.value) {
      elTo.value = elFrom.value;
      salvarCampo(c.to, elTo.value);
    }
  });
}

function alternarAba(aba) {
  abaAtiva = aba;
  const formOficial = document.getElementById('form-oficial');
  const formEmprestimo = document.getElementById('form-emprestimo');
  const btnOficial = document.getElementById('abaOficial');
  const btnEmprestimo = document.getElementById('abaEmprestimo');
  const titulo = document.getElementById('tituloChecklist');

  if (aba === 'oficial') {
    formOficial.classList.remove('hidden');
    formEmprestimo.classList.add('hidden');
    btnOficial.classList.remove('inactive'); btnOficial.classList.add('oficial');
    btnEmprestimo.classList.add('inactive'); btnEmprestimo.classList.remove('emprestimo');
    titulo.textContent = 'CHECKLIST — VEÍCULO OFICIAL';
  } else {
    formOficial.classList.add('hidden');
    formEmprestimo.classList.remove('hidden');
    btnOficial.classList.add('inactive'); btnOficial.classList.remove('oficial');
    btnEmprestimo.classList.remove('inactive'); btnEmprestimo.classList.add('emprestimo');
    titulo.textContent = 'CHECKLIST — VEÍCULO DE EMPRÉSTIMO';
  }
}

function restaurarModo() {
  const modo = obterCampo('modoOperacao') || 'simples';
  setModo(modo);
}

// ============================================
// CLEAR FORM
// ============================================
function limparFormulario() {
  if (!confirm('Deseja realmente limpar todo o formulário (incluindo fotos) para iniciar uma nova vistoria?')) return;

  limparTodosOsCampos();
  limparTodasFotos();

  // Visual reset
  document.querySelectorAll('input[type="text"], input[type="number"], input[type="date"], input[type="time"], textarea, select').forEach(el => {
    el.value = '';
    if (el.tagName === 'SELECT') el.selectedIndex = 0;
  });
  document.querySelectorAll('.check-btn').forEach(b => {
    b.classList.remove('active-sim', 'active-nao', 'active-dan');
    const tipo = b.getAttribute('data-tipo');
    if (tipo === 'sim') b.textContent = 'SIM';
    if (tipo === 'nao') b.textContent = 'NÃO';
    if (tipo === 'dan') b.textContent = 'DANIF.';
  });
  document.querySelectorAll('.fuel-level').forEach(b => b.classList.remove('selected'));
  document.querySelectorAll('.photo-box img').forEach(img => { img.src = ''; img.style.display = 'none'; });

  const preview = document.getElementById('signaturePreview');
  if (preview) preview.src = '';

  if (typeof clearSign === 'function') clearSign();

  window.location.reload();
}

// ============================================
// WHATSAPP SHARE
// ============================================
function enviarWhatsApp() {
  const vistoriador = document.getElementById('nomeVistoriador')?.value?.trim();
  const veiculo = document.getElementById('veiculoNome')?.value?.trim();
  const placa = document.getElementById('placaVeiculo')?.value?.trim();
  const combustivel = document.getElementById('valorCombustivel')?.value || 'Não selecionado';

  if (!vistoriador) {
    alert('Por favor, preencha o campo Vistoriador antes de compartilhar.');
    return;
  }

  const texto = `📌 *CHECKLIST VEICULAR TJGO CONCLUÍDO*

👤 *Vistoriador:* ${vistoriador}
🚗 *Veículo:* ${veiculo || '-'}
🔢 *Placa:* ${placa || '-'}
⛽ *Combustível:* ${combustivel}

Status da vistoria finalizado e salvo no dispositivo!`;

  window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(texto)}`, '_blank');
}

// ============================================
// COR MOVIMENTACAO (ENTRADA/SAIDA)
// ============================================
function setupCorMovimentacao(selectId) {
  const select = document.getElementById(selectId);
  if (!select) return;
  
  const updateColor = () => {
    if (select.value === 'Entrada') {
      select.style.backgroundColor = 'var(--azul-tjgo)';
      select.style.color = 'white';
    } else if (select.value === 'Saída') {
      select.style.backgroundColor = 'var(--cinza-500)';
      select.style.color = 'white';
    } else {
      select.style.backgroundColor = '';
      select.style.color = '';
    }
  };
  
  select.addEventListener('change', updateColor);
  updateColor(); // Initial call
}
