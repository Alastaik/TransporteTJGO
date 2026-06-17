// ============================================
// PDF-GENERATOR.JS — Geração e Upload de PDFs
// ============================================
async function gerarPDFCompleto(tipoVeiculo, pageCtx) {
  try {
    App.showLoading('Coletando dados para o PDF...');
    
    const getVal = (id) => {
      const el = document.getElementById(id);
      return el ? el.value || '' : '';
    };

    // Construir o objeto 'data' compatível com o gerador profissional
    const data = {
      id: pageCtx.checklistId || Date.now(),
      status: pageCtx.existingData ? pageCtx.existingData.status : (pageCtx.fase === 'entrada' ? 'em_andamento' : 'concluido'),
      tipo: tipoVeiculo === 'ambos' ? 'troca' : 'simples',
      
      unidade: getVal('dadosUnidade'),
      destino: getVal('dadosDestino'),
      objetivo: getVal('dadosObjetivo'),
      motorista_nome: getVal('nomeCondutor') || (pageCtx.existingData && pageCtx.existingData.motorista_nome) || '',
      motorista_cnh: getVal('cnhCondutor') || (pageCtx.existingData && pageCtx.existingData.motorista_cnh) || '',
      
      vistoriador_nome: (Auth.getUser() || {}).nome || (pageCtx.existingData && pageCtx.existingData.vistoriador_nome) || '',
      vistoriador_matricula: (Auth.getUser() || {}).matricula || (pageCtx.existingData && pageCtx.existingData.vistoriador_matricula) || '',
      
      // Veículo Oficial
      veiculo_placa: getVal('placaVeiculo'),
      veiculo_modelo: getVal('veiculoNome'),
      veiculo_marca: getVal('veiculoMarca'),
      veiculo_ano: getVal('veiculoAno'),
      veiculo_cor: getVal('veiculoCor'),
      veiculo_motor: getVal('veiculoMotor'),
      veiculo_placa_descaract: getVal('placaDescaracterizada') || '',

      // Veículo Empréstimo
      emp_placa: getVal('placaVeiculo_emp'),
      emp_modelo: getVal('veiculoNome_emp'),
      emp_marca: getVal('veiculoMarca_emp'),
      emp_ano: getVal('veiculoAno_emp'),
      emp_cor: getVal('veiculoCor_emp'),
      emp_motor: getVal('veiculoMotor_emp'),
      emp_placa_descaract: getVal('placaDescaracterizada_emp') || '',
      
      // Movimentação Oficial
      entrada_data: (pageCtx.fase === 'entrada' || !pageCtx.existingData) ? getVal('movimentacaoData') : (pageCtx.existingData.entrada_data || ''),
      entrada_hora: (pageCtx.fase === 'entrada' || !pageCtx.existingData) ? getVal('movimentacaoHora') : (pageCtx.existingData.entrada_hora || ''),
      entrada_km: (pageCtx.fase === 'entrada' || !pageCtx.existingData) ? getVal('veiculoKM') : (pageCtx.existingData.entrada_km || ''),
      entrada_combustivel: (pageCtx.fase === 'entrada' || !pageCtx.existingData) ? getVal('valorCombustivel') : (pageCtx.existingData.entrada_combustivel || ''),
      
      saida_data: pageCtx.fase === 'saida' ? getVal('movimentacaoData') : (pageCtx.existingData ? pageCtx.existingData.saida_data : ''),
      saida_hora: pageCtx.fase === 'saida' ? getVal('movimentacaoHora') : (pageCtx.existingData ? pageCtx.existingData.saida_hora : ''),
      saida_km: pageCtx.fase === 'saida' ? getVal('veiculoKM') : (pageCtx.existingData ? pageCtx.existingData.saida_km : ''),
      saida_combustivel: pageCtx.fase === 'saida' ? getVal('valorCombustivel') : (pageCtx.existingData ? pageCtx.existingData.saida_combustivel : ''),

      // Movimentação Empréstimo
      emp_entrada_data: (pageCtx.fase === 'entrada' || !pageCtx.existingData) ? getVal('movimentacaoData_emp') : ((pageCtx.existingData || {}).emp_entrada_data || ''),
      emp_entrada_hora: (pageCtx.fase === 'entrada' || !pageCtx.existingData) ? getVal('movimentacaoHora_emp') : ((pageCtx.existingData || {}).emp_entrada_hora || ''),
      emp_entrada_km: (pageCtx.fase === 'entrada' || !pageCtx.existingData) ? getVal('veiculoKM_emp') : ((pageCtx.existingData || {}).emp_entrada_km || ''),
      emp_entrada_combustivel: (pageCtx.fase === 'entrada' || !pageCtx.existingData) ? getVal('valorCombustivel_emp') : ((pageCtx.existingData || {}).emp_entrada_combustivel || ''),
      
      emp_saida_data: pageCtx.fase === 'saida' ? getVal('movimentacaoData_emp') : ((pageCtx.existingData || {}).emp_saida_data || ''),
      emp_saida_hora: pageCtx.fase === 'saida' ? getVal('movimentacaoHora_emp') : ((pageCtx.existingData || {}).emp_saida_hora || ''),
      emp_saida_km: pageCtx.fase === 'saida' ? getVal('veiculoKM_emp') : ((pageCtx.existingData || {}).emp_saida_km || ''),
      emp_saida_combustivel: pageCtx.fase === 'saida' ? getVal('valorCombustivel_emp') : ((pageCtx.existingData || {}).emp_saida_combustivel || ''),

      fotos: []
    };

    const collectChecklist = (prefix) => pageCtx.collectFormData(prefix);
    
    if (pageCtx.fase === 'entrada' || !pageCtx.existingData) {
      data.entrada_checklist = collectChecklist('');
      data.emp_entrada_checklist = collectChecklist('_emp');
    } else {
      data.entrada_checklist = typeof pageCtx.existingData.entrada_checklist === 'string' ? JSON.parse(pageCtx.existingData.entrada_checklist) : (pageCtx.existingData.entrada_checklist || []);
      data.emp_entrada_checklist = typeof pageCtx.existingData.emp_entrada_checklist === 'string' ? JSON.parse(pageCtx.existingData.emp_entrada_checklist) : (pageCtx.existingData.emp_entrada_checklist || []);
      data.saida_checklist = collectChecklist('');
      data.emp_saida_checklist = collectChecklist('_emp');
    }

    if (pageCtx.fase === 'entrada' || !pageCtx.existingData) {
      data.entrada_outros_defeitos = getVal('outrosDefeitos');
      data.entrada_obs = getVal('obsGerais');
      data.entrada_servicos = getVal('servicosRealizados');
      data.emp_entrada_outros_defeitos = getVal('outrosDefeitos_emp');
      data.emp_entrada_obs = getVal('obsGerais_emp');
      data.emp_entrada_servicos = getVal('servicosRealizados_emp');
    } else {
      data.entrada_outros_defeitos = pageCtx.existingData.entrada_outros_defeitos || '';
      data.entrada_obs = pageCtx.existingData.entrada_obs || '';
      data.entrada_servicos = pageCtx.existingData.entrada_servicos || '';
      data.emp_entrada_outros_defeitos = pageCtx.existingData.emp_entrada_outros_defeitos || '';
      data.emp_entrada_obs = pageCtx.existingData.emp_entrada_obs || '';
      data.emp_entrada_servicos = pageCtx.existingData.emp_entrada_servicos || '';

      data.saida_outros_defeitos = getVal('outrosDefeitos');
      data.saida_obs = getVal('obsGerais');
      data.saida_servicos = getVal('servicosRealizados');
      data.emp_saida_outros_defeitos = getVal('outrosDefeitos_emp');
      data.emp_saida_obs = getVal('obsGerais_emp');
      data.emp_saida_servicos = getVal('servicosRealizados_emp');
    }

    // Assinaturas
    const sigImg = document.getElementById('signaturePreview');
    const hasSig = sigImg && sigImg.src && sigImg.src.startsWith('data:');
    
    if (pageCtx.fase === 'entrada' || !pageCtx.existingData) {
        data.entrada_assinatura = hasSig ? sigImg.src : null;
        data.emp_entrada_assinatura = hasSig ? sigImg.src : null;
    } else {
        data.entrada_assinatura = pageCtx.existingData.entrada_assinatura || null;
        data.emp_entrada_assinatura = pageCtx.existingData.emp_entrada_assinatura || null;
        data.saida_assinatura = hasSig ? sigImg.src : null;
        data.emp_saida_assinatura = hasSig ? sigImg.src : null;
    }

    // Fotos do banco
    if (pageCtx.existingData && pageCtx.existingData.fotos) {
        data.fotos.push(...pageCtx.existingData.fotos);
    }
    
    // Fotos capturadas agorinha
    for (const key in pageCtx.fotosCaptured) {
        const fotoObj = pageCtx.fotosCaptured[key];
        if (!data.fotos.some(f => f.label === fotoObj.label && f.categoria === fotoObj.categoria)) {
            data.fotos.push(fotoObj);
        }
    }

    // Invoca o gerador profissional e envia o PDF local em formato blob para o backend
    if (typeof window.generateProfessionalPDF === 'function') {
      const doc = await window.generateProfessionalPDF(data, pageCtx.fase, tipoVeiculo);

      if (doc && pageCtx.checklistId) {
        const fileName = `Checklist_${data.veiculo_placa}_${tipoVeiculo.toUpperCase()}_${new Date().getTime()}.pdf`;
        const pdfBlob = doc.output('blob');
        const file = new File([pdfBlob], fileName, { type: 'application/pdf' });
        
        if (navigator.onLine) {
          try {
            await API.uploadPDF(file, pageCtx.checklistId, tipoVeiculo);
            App.toast('PDF sincronizado com o servidor.', 'success');
          } catch (err) {
            console.warn('Erro ao upload PDF em background', err);
          }
        } else {
          // Grava pra sync
          const pdfBase64 = doc.output('datauristring');
          await LocalDB.queueSync({
            type: 'upload_pdf',
            checklistId: pageCtx.checklistId,
            tipoVeiculo: tipoVeiculo,
            fileName: fileName,
            pdfBase64: pdfBase64
          });
          App.toast('PDF agendado para envio offline.', 'info');
        }
      }
    } else {
      App.toast('Gerador de PDF profissional não encontrado.', 'error');
    }

  } catch (error) {
    App.hideLoading();
    App.toast('Erro ao preparar PDF: ' + error.message, 'error');
    console.error(error);
  }
}
