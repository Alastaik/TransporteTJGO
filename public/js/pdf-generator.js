// ============================================
// PDF-GENERATOR.JS — Geração e Upload de PDFs
// ============================================
async function gerarPDFCompleto(tipo, pageCtx) {
  try {
    App.showLoading('Gerando PDF...');

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    const getVal = (id) => {
      const el = document.getElementById(id);
      return el ? el.value || 'N/A' : 'N/A';
    };

    const tiposParaGerar = tipo === 'ambos' ? ['oficial', 'emprestimo'] : [tipo];

    tiposParaGerar.forEach((t, idx) => {
      if (idx > 0) doc.addPage();
      
      let yPos = 20;
      const marginLeft = 15;
      const maxWid = 180;
      const suffix = t === 'emprestimo' ? '_emp' : '';
      const labelTipo = t === 'emprestimo' ? 'EMPRÉSTIMO' : 'OFICIAL';

      // Header
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text(`CHECKLIST DE VEÍCULO ${labelTipo}`, 105, yPos, { align: 'center' });
      yPos += 15;

      // Dados da Viagem
      doc.setFontSize(12);
      doc.setFillColor(230, 230, 230);
      doc.rect(marginLeft, yPos - 5, maxWid, 7, 'F');
      doc.text("DADOS DA VIAGEM", marginLeft + 2, yPos);
      yPos += 8;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`Unidade: ${getVal(`dadosUnidade${suffix}`)}`, marginLeft, yPos); yPos += 6;
      doc.text(`Destino / Comarca: ${getVal(`dadosDestino${suffix}`)}`, marginLeft, yPos); yPos += 6;
      doc.text(`Objetivo: ${getVal(`dadosObjetivo${suffix}`)}`, marginLeft, yPos); yPos += 10;

      // Dados do Veículo
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setFillColor(230, 230, 230);
      doc.rect(marginLeft, yPos - 5, maxWid, 7, 'F');
      doc.text("DADOS DO VEÍCULO", marginLeft + 2, yPos);
      yPos += 8;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`Placa: ${getVal(`placaVeiculo${suffix}`)}`, marginLeft, yPos);
      doc.text(`Modelo: ${getVal(`veiculoNome${suffix}`)}`, marginLeft + 70, yPos); yPos += 6;
      doc.text(`Marca: ${getVal(`veiculoMarca${suffix}`)}`, marginLeft, yPos);
      doc.text(`Ano: ${getVal(`veiculoAno${suffix}`)}`, marginLeft + 70, yPos); yPos += 6;
      doc.text(`Cor: ${getVal(`veiculoCor${suffix}`)}`, marginLeft, yPos);
      doc.text(`Motor: ${getVal(`veiculoMotor${suffix}`)}`, marginLeft + 70, yPos); yPos += 10;

      // Entrada/Saída Compare
      doc.setFont("helvetica", "bold");
      doc.text("REGISTRO DE ENTRADA / SAÍDA", marginLeft, yPos);
      yPos += 6;
      
      let entData = getVal(`movimentacaoData${suffix}`);
      let entHora = getVal(`movimentacaoHora${suffix}`);
      let entKm = getVal(`veiculoKM${suffix}`);
      let entComb = getVal(`valorCombustivel${suffix}`);
      
      let saiData = 'N/A';
      let saiHora = 'N/A';
      let saiKm = 'N/A';
      let saiComb = 'N/A';

      if (pageCtx.fase === 'saida' && pageCtx.existingData) {
        const d = pageCtx.existingData;
        const p = t === 'emprestimo' ? 'emp_' : '';
        entData = d[`${p}entrada_data`] || 'N/A';
        entHora = d[`${p}entrada_hora`] || 'N/A';
        entKm = d[`${p}entrada_km`] || 'N/A';
        entComb = d[`${p}entrada_combustivel`] || 'N/A';
        
        saiData = getVal(`movimentacaoData${suffix}`);
        saiHora = getVal(`movimentacaoHora${suffix}`);
        saiKm = getVal(`veiculoKM${suffix}`);
        saiComb = getVal(`valorCombustivel${suffix}`);
      } else if (pageCtx.existingData && pageCtx.existingData.status === 'concluido') {
        const d = pageCtx.existingData;
        const p = t === 'emprestimo' ? 'emp_' : '';
        entData = d[`${p}entrada_data`] || 'N/A';
        entHora = d[`${p}entrada_hora`] || 'N/A';
        entKm = d[`${p}entrada_km`] || 'N/A';
        entComb = d[`${p}entrada_combustivel`] || 'N/A';
        saiData = d[`${p}saida_data`] || 'N/A';
        saiHora = d[`${p}saida_hora`] || 'N/A';
        saiKm = d[`${p}saida_km`] || 'N/A';
        saiComb = d[`${p}saida_combustivel`] || 'N/A';
      }

      doc.setFont("helvetica", "normal");
      doc.text(`ENTRADA -> Data: ${entData} | Hora: ${entHora} | KM: ${entKm} | Combustível: ${entComb}`, marginLeft, yPos); yPos += 6;
      doc.text(`SAÍDA -> Data: ${saiData} | Hora: ${saiHora} | KM: ${saiKm} | Combustível: ${saiComb}`, marginLeft, yPos); yPos += 10;

      // Checklist
      doc.setFont("helvetica", "bold");
      doc.setFillColor(230, 230, 230);
      doc.rect(marginLeft, yPos - 5, maxWid, 7, 'F');
      doc.text("ITENS DE CHECKLIST", marginLeft + 2, yPos);
      yPos += 8;

      doc.setFont("helvetica", "bold");
      doc.text("Item", marginLeft, yPos);
      doc.text("Avaliação", marginLeft + 80, yPos);
      doc.text("Defeito", marginLeft + 120, yPos);
      yPos += 6;
      
      doc.setFont("helvetica", "normal");
      let checklistArr = [];
      if (pageCtx.fase === 'entrada' || !pageCtx.existingData) {
        checklistArr = pageCtx.collectFormData(suffix);
      } else {
        if (pageCtx.data && pageCtx.data.saida_checklist) {
          checklistArr = typeof pageCtx.data.saida_checklist === 'string' ? JSON.parse(pageCtx.data.saida_checklist) : pageCtx.data.saida_checklist;
        } else {
           checklistArr = pageCtx.collectFormData(suffix);
        }
      }

      checklistArr.forEach(c => {
        if (yPos > 270) { doc.addPage(); yPos = 20; }
        doc.text(c.item || '', marginLeft, yPos);
        let av = c.avaliacao.toUpperCase();
        if(av === 'DAN') av = 'DANIFICADO';
        doc.text(av || 'N/A', marginLeft + 80, yPos);
        doc.text(c.defeito || '-', marginLeft + 120, yPos);
        yPos += 6;
      });
      
      yPos += 4;
      doc.text(`Outros Defeitos: ${getVal(`outrosDefeitos${suffix}`) || 'Nenhum'}`, marginLeft, yPos); yPos += 10;

      // Observações
      doc.setFont("helvetica", "bold");
      doc.setFillColor(230, 230, 230);
      doc.rect(marginLeft, yPos - 5, maxWid, 7, 'F');
      doc.text("OBSERVAÇÕES GERAIS E SERVIÇOS", marginLeft + 2, yPos);
      yPos += 8;
      doc.setFont("helvetica", "normal");
      const obs = doc.splitTextToSize(getVal(`obsGerais${suffix}`), maxWid);
      doc.text(obs, marginLeft, yPos); yPos += (obs.length * 6) + 4;
      const servicos = doc.splitTextToSize(`Serviços: ${getVal(`servicosRealizados${suffix}`)}`, maxWid);
      doc.text(servicos, marginLeft, yPos); yPos += (servicos.length * 6) + 10;

      // Assinaturas
      if (yPos > 220) { doc.addPage(); yPos = 20; }
      doc.setFont("helvetica", "bold");
      doc.text("ASSINATURAS", 105, yPos, { align: 'center' }); yPos += 20;

      // Motorista
      doc.line(20, yPos, 90, yPos);
      let motNome = getVal('nomeCondutor');
      let motCnh = getVal('cnhCondutor');
      if (!motNome && pageCtx.existingData) motNome = pageCtx.existingData.motorista_nome;
      if (!motCnh && pageCtx.existingData) motCnh = pageCtx.existingData.motorista_cnh;
      doc.setFontSize(9);
      doc.text(motNome || "Condutor", 55, yPos + 5, { align: 'center' });
      doc.text(`CNH/Mat.: ${motCnh || '-'}`, 55, yPos + 10, { align: 'center' });

      // Vistoriador
      doc.line(120, yPos, 190, yPos);
      const user = Auth.getUser();
      let vistNome = user ? user.nome : 'Vistoriador';
      let vistMat = user ? user.matricula : '-';
      if (pageCtx.existingData && pageCtx.existingData.vistoriador_nome) {
        vistNome = pageCtx.existingData.vistoriador_nome;
        vistMat = pageCtx.existingData.vistoriador_matricula;
      }
      doc.text(vistNome, 155, yPos + 5, { align: 'center' });
      doc.text(`Matrícula: ${vistMat}`, 155, yPos + 10, { align: 'center' });
      yPos += 20;

      // Assinatura Canvas
      const sigImg = document.getElementById('signaturePreview');
      if (sigImg && sigImg.src && sigImg.src.startsWith('data:')) {
        doc.addImage(sigImg.src, 'PNG', 120, yPos - 35, 70, 20);
      } else if (pageCtx.existingData && pageCtx.existingData.entrada_assinatura) {
         doc.addImage(pageCtx.existingData.entrada_assinatura, 'PNG', 120, yPos - 35, 70, 20);
      }

      // Fotos (se houver)
      const renderPhotosToPDF = (prefix, formId) => {
        let fotosArr = [];
        for (const key in pageCtx.fotosCaptured) {
          if (key.includes(prefix) && key.includes(formId)) {
            fotosArr.push(pageCtx.fotosCaptured[key]);
          }
        }
        
        if (fotosArr.length === 0 && pageCtx.existingData && pageCtx.existingData.fotos) {
            pageCtx.existingData.fotos.forEach(f => {
                if (f.categoria.includes(prefix) && f.categoria.includes(formId === 'oficial' ? 'oficial' : 'emprestimo')) {
                    fotosArr.push(f);
                }
            });
        }

        if (fotosArr.length > 0) {
          doc.addPage();
          yPos = 20;
          doc.setFontSize(14);
          doc.setFont("helvetica", "bold");
          doc.text(`ANEXO FOTOGRÁFICO - ${prefix.toUpperCase()}`, 105, yPos, { align: 'center' });
          yPos += 15;

          let col = 0;
          let rowH = 60;
          let imgW = 80;
          let marginX = 20;

          fotosArr.forEach((foto) => {
            if (yPos > 240) { doc.addPage(); yPos = 20; col = 0; }
            const x = col === 0 ? marginX : marginX + imgW + 10;
            doc.setFontSize(10);
            doc.text(foto.label, x, yPos);
            if (foto.dados) {
              try { doc.addImage(foto.dados, 'JPEG', x, yPos + 2, imgW, 45); } 
              catch (e) { console.warn('Erro ao inserir foto no PDF:', e); }
            }
            if (col === 1) { col = 0; yPos += rowH; } 
            else { col = 1; }
          });
        }
      };

      renderPhotosToPDF('geral', t);
      renderPhotosToPDF('avaria', t);
    });

    // Save and Upload
    const fileName = `Checklist_${getVal('placaVeiculo')}_${tipo.toUpperCase()}_${new Date().getTime()}.pdf`;
    
    if (navigator.onLine && pageCtx.checklistId) {
      const pdfBlob = doc.output('blob');
      const file = new File([pdfBlob], fileName, { type: 'application/pdf' });
      
      try {
        await API.uploadPDF(file, pageCtx.checklistId, tipo);
        App.toast('PDF salvo no servidor e baixando...', 'success');
        doc.save(fileName);
      } catch (err) {
        App.toast('Erro ao fazer upload do PDF: ' + err.message, 'error');
        doc.save(fileName);
      }
    } else if (!navigator.onLine && pageCtx.checklistId) {
      const pdfBase64 = doc.output('datauristring');
      await LocalDB.queueSync({
        type: 'upload_pdf',
        checklistId: pageCtx.checklistId,
        tipoVeiculo: tipo,
        fileName: fileName,
        pdfBase64: pdfBase64
      });
      App.toast('PDF gerado e agendado para envio offline', 'info');
      doc.save(fileName);
    } else {
      App.toast('Checklist ainda não foi salvo. Baixando versão local.', 'warning');
      doc.save(fileName);
    }

    App.hideLoading();
  } catch (error) {
    App.hideLoading();
    App.toast('Erro ao gerar PDF: ' + error.message, 'error');
    console.error(error);
  }
}
