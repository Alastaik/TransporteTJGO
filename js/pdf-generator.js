// ============================================
// PDF GENERATOR - Professional document PDF
// Uses jsPDF to build documents programmatically
// ============================================

async function gerarPDF(tipoVeiculo) {
  // tipoVeiculo: 'oficial', 'emprestimo', or 'vistoria' (simple mode)

  const suffix = tipoVeiculo === 'emprestimo' ? '_emp' : '';
  const formId = tipoVeiculo === 'emprestimo' ? 'form-emprestimo' : 'form-oficial';

  // Show loading
  const loading = document.getElementById('loadingOverlay');
  if (loading) loading.classList.add('active');

  try {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    const pageW = 210, pageH = 297;
    const margin = 15;
    const contentW = pageW - margin * 2;
    let y = margin;

    const azul = [0, 59, 142];
    const cinzaClaro = [240, 244, 255];
    const branco = [255, 255, 255];
    const preto = [30, 30, 30];
    const verde = [22, 163, 74];
    const vermelho = [220, 38, 38];
    const azulDan = [37, 99, 235];

    // ============ HELPER FUNCTIONS ============
    function checkNewPage(needed) {
      if (y + needed > pageH - 20) {
        doc.addPage();
        y = margin;
        return true;
      }
      return false;
    }

    function drawLine(x1, yPos, x2) {
      doc.setDrawColor(200, 210, 230);
      doc.setLineWidth(0.3);
      doc.line(x1, yPos, x2, yPos);
    }

    function drawSectionHeader(text) {
      checkNewPage(14);
      doc.setFillColor(...azul);
      doc.roundedRect(margin, y, contentW, 9, 2, 2, 'F');
      doc.setTextColor(...branco);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(text, margin + 5, y + 6.5);
      y += 13;
      doc.setTextColor(...preto);
    }

    function drawField(label, value, x, width) {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 120);
      doc.text(label, x, y);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...preto);
      doc.text(String(value || '-'), x, y + 5);
    }

    function getVal(id) {
      const el = document.getElementById(id);
      return el ? el.value.trim() : '';
    }

    // ============ HEADER ============
    // Blue header bar
    doc.setFillColor(...azul);
    doc.roundedRect(margin, y, contentW, 28, 3, 3, 'F');
    
    // Add Brasão
    const logoImg = document.querySelector('img[alt="Brasão TJGO"]');
    if (logoImg && logoImg.complete && logoImg.naturalWidth > 0) {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = logoImg.naturalWidth;
        canvas.height = logoImg.naturalHeight;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(logoImg, 0, 0);
        const logoBase64 = canvas.toDataURL("image/png");
        doc.addImage(logoBase64, 'PNG', margin + 8, y + 4, 18, 20);
      } catch (e) {
        console.warn('Não foi possível adicionar o brasão ao PDF:', e);
      }
    }
    
    // Title text
    doc.setTextColor(...branco);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('PODER JUDICIÁRIO', pageW / 2, y + 8, { align: 'center' });
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Tribunal de Justiça do Estado de Goiás', pageW / 2, y + 14, { align: 'center' });
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');

    let tituloDoc = 'CHECKLIST VEICULAR';
    if (tipoVeiculo === 'oficial') tituloDoc = 'CHECKLIST VEICULAR — VEÍCULO OFICIAL';
    else if (tipoVeiculo === 'emprestimo') tituloDoc = 'CHECKLIST VEICULAR — VEÍCULO DE EMPRÉSTIMO';
    doc.text(tituloDoc, pageW / 2, y + 22, { align: 'center' });
    
    y += 34;

    // ============ RESPONSÁVEL ============
    drawSectionHeader('1. RESPONSÁVEL PELA VISTORIA');
    
    const nomeVist = getVal('nomeVistoriador');
    const matVist = getVal('matriculaVistoriador');
    
    drawField('Nome do Vistoriador', nomeVist, margin, contentW / 2);
    drawField('Matrícula', matVist, margin + contentW / 2, contentW / 2);
    y += 10;

    // ============ DADOS DA VIAGEM ============
    drawSectionHeader('2. DADOS DA VIAGEM');
    
    const unidade = getVal(`dadosUnidade${suffix}`);
    const destino = getVal(`dadosDestino${suffix}`);
    const objetivo = getVal(`dadosObjetivo${suffix}`);

    drawField('Unidade', unidade, margin, contentW);
    y += 10;
    drawField('Destino', destino, margin, contentW / 2);
    drawField('Objetivo', objetivo, margin + contentW / 2, contentW / 2);
    y += 10;

    // ============ DADOS DO VEÍCULO ============
    drawSectionHeader('3. DADOS DO VEÍCULO');

    const placa = getVal(`placaVeiculo${suffix}`);
    const modelo = getVal(`veiculoNome${suffix}`);
    const marca = getVal(`veiculoMarca${suffix}`);
    const ano = getVal(`veiculoAno${suffix}`);
    const motor = getVal(`veiculoMotor${suffix}`);
    const km = getVal(`veiculoKM${suffix}`);
    const cor = getVal(`veiculoCor${suffix}`);
    const placaDesc = getVal(`placaDescaracterizada${suffix}`);

    // Vehicle info in a grid
    const col3 = contentW / 3;
    drawField('Placa', placa, margin, col3);
    drawField('Modelo', modelo, margin + col3, col3);
    drawField('Marca', marca, margin + col3 * 2, col3);
    y += 10;
    drawField('Ano', ano, margin, col3);
    drawField('Motor', motor, margin + col3, col3);
    drawField('Cor', cor, margin + col3 * 2, col3);
    y += 10;
    drawField('KM', km, margin, col3);
    drawField('Placa Descaracterizada', placaDesc, margin + col3, col3 * 2);
    y += 10;

    // Entrada/Saida + Data/Hora
    const tipoMov = getVal(`movimentacaoTipo${suffix}`);
    const dataMov = getVal(`movimentacaoData${suffix}`);
    const horaMov = getVal(`movimentacaoHora${suffix}`);
    const combustivel = getVal(`valorCombustivel${suffix}`);

    drawField('Tipo', tipoMov || '-', margin, col3);
    drawField('Data', dataMov, margin + col3, col3);
    drawField('Hora', horaMov, margin + col3 * 2, col3);
    y += 10;
    drawField('Nível Combustível', combustivel || '-', margin, contentW);
    y += 8;

    // ============ CHECKLIST TABLE ============
    drawSectionHeader('4. CHECKLIST DE ITENS');

    const colItem = contentW * 0.40;
    const colAval = contentW * 0.25;
    const colDefeito = contentW * 0.35;

    // Table header
    checkNewPage(10);
    doc.setFillColor(...cinzaClaro);
    doc.rect(margin, y, contentW, 7, 'F');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...azul);
    doc.text('ITEM', margin + 3, y + 5);
    doc.text('AVALIAÇÃO', margin + colItem + 3, y + 5);
    doc.text('DEFEITOS / STATUS', margin + colItem + colAval + 3, y + 5);
    y += 8;

    // Table rows
    const allItems = [...ITENS_CHECKLIST];
    const outroNome = getVal(`outroItemNome${suffix}`);
    if (outroNome) allItems.push(outroNome);

    allItems.forEach((item, index) => {
      checkNewPage(8);
      
      // Alternating background
      if (index % 2 === 0) {
        doc.setFillColor(250, 251, 255);
        doc.rect(margin, y - 1, contentW, 7, 'F');
      }

      const idx = index < ITENS_CHECKLIST.length ? `${index}${suffix}` : `outro${suffix}`;
      const status = obterCampo(`btn-${idx}`) || '';
      const defeito = getVal(`select-item-${idx}`);

      // Item name
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...preto);
      doc.text(item, margin + 3, y + 4);

      // Status badge
      if (status === 'sim') {
        doc.setFillColor(...verde);
        doc.roundedRect(margin + colItem + 3, y, 16, 6, 1, 1, 'F');
        doc.setTextColor(...branco);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.text('SIM', margin + colItem + 6, y + 4.2);
      } else if (status === 'nao') {
        doc.setFillColor(...vermelho);
        doc.roundedRect(margin + colItem + 3, y, 16, 6, 1, 1, 'F');
        doc.setTextColor(...branco);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.text('NÃO', margin + colItem + 5.5, y + 4.2);
      } else if (status === 'dan') {
        doc.setFillColor(...azulDan);
        doc.roundedRect(margin + colItem + 3, y, 20, 6, 1, 1, 'F');
        doc.setTextColor(...branco);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.text('DANIF.', margin + colItem + 5, y + 4.2);
      } else {
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text('-', margin + colItem + 10, y + 4);
      }

      // Defeito
      doc.setFontSize(8);
      doc.setTextColor(...preto);
      doc.setFont('helvetica', 'normal');
      doc.text(defeito || 'Normal', margin + colItem + colAval + 3, y + 4);

      // Row border
      drawLine(margin, y + 6, margin + contentW);
      y += 7;
    });

    y += 4;

    // Outros defeitos text
    const outrosDefeitos = getVal(`outrosDefeitos${suffix}`);
    if (outrosDefeitos) {
      checkNewPage(14);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...azul);
      doc.text('Outros defeitos:', margin, y + 4);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...preto);
      const lines = doc.splitTextToSize(outrosDefeitos, contentW - 5);
      doc.text(lines, margin, y + 9);
      y += 9 + lines.length * 4;
    }

    // ============ PHOTOS ============
    function drawPhotosGrid(containerId, sectionTitle) {
      const container = document.getElementById(containerId);
      if (!container) return;

      const photoImages = container.querySelectorAll('.photo-box img');
      const validPhotos = [];
      photoImages.forEach((img, i) => {
        if (img.src && img.style.display !== 'none' && img.src.startsWith('data:')) {
          const label = img.closest('.photo-box')?.querySelector('b')?.textContent || `Foto ${i+1}`;
          validPhotos.push({ src: img.src, label });
        }
      });

      if (validPhotos.length > 0) {
        doc.addPage();
        y = margin;
        drawSectionHeader(sectionTitle);

        const photoW = (contentW - 8) / 2;
        const photoH = 55;
        let col = 0;

        for (let i = 0; i < validPhotos.length; i++) {
          if (checkNewPage(photoH + 12)) {
            col = 0;
          }

          const x = margin + col * (photoW + 8);

          try {
            doc.addImage(validPhotos[i].src, 'JPEG', x, y, photoW, photoH);
          } catch (e) {
            doc.setFillColor(240, 240, 240);
            doc.rect(x, y, photoW, photoH, 'F');
            doc.setFontSize(8);
            doc.setTextColor(150, 150, 150);
            doc.text('Imagem indisponível', x + photoW / 2, y + photoH / 2, { align: 'center' });
          }

          doc.setFontSize(7);
          doc.setTextColor(...cinzaClaro[0] === 240 ? preto : preto);
          doc.setFont('helvetica', 'bold');
          doc.text(validPhotos[i].label, x, y + photoH + 4);

          col++;
          if (col >= 2) {
            col = 0;
            y += photoH + 10;
          }
        }

        if (col > 0) y += photoH + 10;
      }
    }

    const sufixoId = tipoVeiculo === 'emprestimo' ? 'emprestimo' : 'oficial';
    drawPhotosGrid(`geral-${sufixoId}`, '5. FOTOS GERAIS');
    drawPhotosGrid(`avarias-${sufixoId}`, '6. FOTOS DE AVARIAS');

    // ============ OBSERVAÇÕES ============
    const obs = getVal(`obsGerais${suffix}`);
    const servicos = getVal(`servicosRealizados${suffix}`);

    if (obs || servicos) {
      checkNewPage(30);
      drawSectionHeader('7. OBSERVAÇÕES E SERVIÇOS');
      
      if (obs) {
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text('Observações Gerais:', margin, y + 4);
        doc.setFont('helvetica', 'normal');
        const obsLines = doc.splitTextToSize(obs, contentW - 5);
        doc.text(obsLines, margin, y + 9);
        y += 9 + obsLines.length * 4;
      }
      if (servicos) {
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text('Serviços Realizados:', margin, y + 4);
        doc.setFont('helvetica', 'normal');
        const servLines = doc.splitTextToSize(servicos, contentW - 5);
        doc.text(servLines, margin, y + 9);
        y += 9 + servLines.length * 4;
      }
    }

    // ============ ASSINATURA ============
    checkNewPage(50);
    drawSectionHeader('8. ASSINATURA DO CONDUTOR');

    const nomeCondutor = getVal('nomeCondutor');
    const cnhCondutor = getVal('cnhCondutor');

    // Signature image
    const sigPreview = document.getElementById('signaturePreview');
    if (sigPreview && sigPreview.src && sigPreview.src.startsWith('data:')) {
      try {
        doc.addImage(sigPreview.src, 'PNG', margin + contentW / 4, y, contentW / 2, 25);
        y += 28;
      } catch(e) { y += 5; }
    }

    // Signature line
    drawLine(margin + 20, y + 2, margin + contentW - 20);
    doc.setFontSize(9);
    doc.setTextColor(...preto);
    doc.setFont('helvetica', 'normal');
    doc.text(nomeCondutor || 'Nome do Condutor', pageW / 2, y + 7, { align: 'center' });
    if (cnhCondutor) {
      doc.setFontSize(7);
      doc.text(`Matrícula/CNH: ${cnhCondutor}`, pageW / 2, y + 11, { align: 'center' });
    }
    y += 16;

    // ============ FOOTER ============
    const totalPages = doc.internal.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);
      doc.setFontSize(7);
      doc.setTextColor(150, 150, 160);
      doc.setFont('helvetica', 'normal');
      const timestamp = new Date().toLocaleString('pt-BR');
      doc.text(`Documento gerado pelo Sistema de Checklist Veicular TJGO — ${timestamp}`, pageW / 2, pageH - 8, { align: 'center' });
      doc.text(`Página ${p} de ${totalPages}`, pageW - margin, pageH - 8, { align: 'right' });
    }

    // ============ SAVE ============
    const placaArquivo = (getVal(`placaVeiculo${suffix}`) || 'SEM_PLACA').replace(/\s+/g, '_');
    const dataArquivo = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    let tipoLabel = 'Vistoria';
    if (tipoVeiculo === 'oficial') tipoLabel = 'Oficial';
    else if (tipoVeiculo === 'emprestimo') tipoLabel = 'Emprestimo';
    
    const nomeArquivo = `Checklist_${tipoLabel}_${placaArquivo}_${dataArquivo}.pdf`;
    doc.save(nomeArquivo);

  } catch (err) {
    console.error('Erro na geração do PDF:', err);
    alert('Erro ao gerar o PDF. Verifique o console para detalhes.');
  } finally {
    if (loading) loading.classList.remove('active');
  }
}
