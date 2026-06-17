// ============================================
// PDF-PROFESSIONAL.JS — Geração Profissional On-The-Fly v2
// ============================================

// Helper: carrega imagem como base64 para jsPDF
function loadImageAsBase64(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => reject(new Error('Falha ao carregar imagem: ' + url));
    img.src = url;
  });
}

// Helper: formata data ISO para dd/mm/aaaa
function formatDate(raw) {
  if (!raw) return 'N/A';
  try {
    const d = new Date(raw);
    if (isNaN(d.getTime())) return String(raw);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  } catch (e) { return String(raw); }
}

// Helper: formata hora (remove segundos se vier HH:MM:SS)
function formatHora(raw) {
  if (!raw) return 'N/A';
  const s = String(raw);
  // Se vier "10:44:00", retorna "10:44"
  const parts = s.split(':');
  if (parts.length >= 2) return parts[0] + ':' + parts[1];
  return s;
}

window.generateProfessionalPDF = async function(data, modo) {
  try {
    App.showLoading('Gerando PDF Profissional...');
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');

    // Cores Corporativas
    const AZUL = [41, 98, 155];
    const AZUL_CLARO = [220, 235, 250];
    const CINZA_HEADER = [60, 60, 60];
    const CINZA_LINHA = [245, 245, 245];
    const BRANCO = [255, 255, 255];
    const PRETO = [33, 33, 33];

    const M = 15;            // margem lateral
    const W = 180;           // largura útil
    const pageH = 297;       // altura A4
    const footerH = 20;      // reserva para rodapé

    // Carrega o brasão
    let logoBase64 = null;
    try {
      logoBase64 = await loadImageAsBase64('./brasao.png');
    } catch (e) {
      console.warn('Logo não carregado:', e);
    }

    const tipos = data.tipo === 'troca' ? ['oficial', 'emprestimo'] : ['oficial'];

    tipos.forEach((t, pageIndex) => {
      if (pageIndex > 0) doc.addPage();
      const p = t === 'emprestimo' ? 'emp_' : '';
      let y = 0;

      // ==========================================
      // CABEÇALHO com logo
      // ==========================================
      doc.setFillColor(...AZUL);
      doc.rect(0, 0, 210, 32, 'F');

      // Logo
      if (logoBase64) {
        try { doc.addImage(logoBase64, 'PNG', M, 3, 26, 26); } catch (e) {}
      }

      // Título
      doc.setTextColor(...BRANCO);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(15);
      doc.text('TRIBUNAL DE JUSTIÇA DO ESTADO DE GOIÁS', 105, 12, { align: 'center' });
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('SEÇÃO DE TRANSPORTE — CHECKLIST VEICULAR', 105, 19, { align: 'center' });
      doc.setFontSize(9);
      const subtipo = t === 'emprestimo' ? 'VEÍCULO EMPRÉSTIMO' : 'VEÍCULO OFICIAL';
      doc.text(`Modo: ${modo.toUpperCase()} | ${subtipo}`, 105, 25, { align: 'center' });

      // Linha decorativa
      doc.setFillColor(230, 180, 40);
      doc.rect(0, 32, 210, 1.2, 'F');

      doc.setTextColor(...PRETO);
      y = 40;

      // ==========================================
      // HELPERS
      // ==========================================

      const checkPage = (needed) => {
        if (y + needed > pageH - footerH) { doc.addPage(); y = 20; }
      };

      // Seção com barra colorida
      const addSection = (title) => {
        checkPage(12);
        doc.setFillColor(...AZUL);
        doc.rect(M, y, W, 7, 'F');
        doc.setTextColor(...BRANCO);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text('  ' + title.toUpperCase(), M + 2, y + 5);
        doc.setTextColor(...PRETO);
        y += 10;
      };

      // Sub-seção cinza
      const addSubSection = (title) => {
        checkPage(10);
        doc.setFillColor(...AZUL_CLARO);
        doc.rect(M, y, W, 6, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(...CINZA_HEADER);
        doc.text(title, M + 2, y + 4);
        doc.setTextColor(...PRETO);
        y += 8;
      };

      // Linha label: valor (em 2 ou 3 colunas)
      const addInfoRow = (pairs) => {
        checkPage(7);
        const colW = W / pairs.length;
        doc.setFontSize(8);
        pairs.forEach((pair, i) => {
          const x = M + (i * colW);
          doc.setFont('helvetica', 'bold');
          doc.text(pair[0] + ':', x, y);
          doc.setFont('helvetica', 'normal');
          const labelW = doc.getTextWidth(pair[0] + ': ');
          const val = String(pair[1] || 'N/A');
          doc.text(val, x + labelW, y);
        });
        y += 5.5;
      };

      // Tabela de checklist (3 colunas com bordas)
      const addChecklistTable = (items) => {
        if (!items || items.length === 0) return;

        const cols = 3;
        const colW = W / cols;
        const rowH = 5.5;

        // Header da tabela
        checkPage(8);
        doc.setFillColor(...CINZA_HEADER);
        for (let c = 0; c < cols; c++) {
          doc.rect(M + (c * colW), y, colW, 6, 'F');
        }
        doc.setTextColor(...BRANCO);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        for (let c = 0; c < cols; c++) {
          doc.text('ITEM', M + (c * colW) + 2, y + 4);
          doc.text('STATUS', M + (c * colW) + colW - 14, y + 4);
        }
        doc.setTextColor(...PRETO);
        y += 6;

        // Distribui em 3 colunas lado a lado
        const rows = Math.ceil(items.length / cols);
        for (let r = 0; r < rows; r++) {
          checkPage(rowH + 1);
          // Fundo alternado
          if (r % 2 === 0) {
            doc.setFillColor(...CINZA_LINHA);
            doc.rect(M, y, W, rowH, 'F');
          }
          // Bordas horizontais
          doc.setDrawColor(200, 200, 200);
          doc.line(M, y + rowH, M + W, y + rowH);

          doc.setFontSize(7);
          for (let c = 0; c < cols; c++) {
            const idx = r + (c * rows);
            if (idx < items.length) {
              const item = items[idx];
              doc.setFont('helvetica', 'normal');
              doc.text(item.item || '', M + (c * colW) + 2, y + 3.8);

              // Status com cor
              const status = (item.avaliacao || '').toUpperCase();
              if (status === 'SIM') {
                doc.setTextColor(16, 150, 72);
              } else if (status === 'NAO' || status === 'NÃO') {
                doc.setTextColor(220, 50, 50);
              } else {
                doc.setTextColor(200, 140, 20);
              }
              doc.setFont('helvetica', 'bold');
              doc.text(status || '-', M + (c * colW) + colW - 14, y + 3.8);

              // Defeito se houver
              if (item.defeito) {
                doc.setTextColor(180, 80, 80);
                doc.setFont('helvetica', 'italic');
                doc.setFontSize(6);
                doc.text('(' + item.defeito + ')', M + (c * colW) + colW - 14, y + 3.8 + 3);
                doc.setFontSize(7);
              }
              doc.setTextColor(...PRETO);
            }
            // Linhas verticais de separação
            if (c > 0) {
              doc.setDrawColor(200, 200, 200);
              doc.line(M + (c * colW), y, M + (c * colW), y + rowH);
            }
          }
          y += rowH;
        }
        // Borda externa da tabela
        doc.setDrawColor(180, 180, 180);
        const tableH = rows * rowH + 6;
        doc.rect(M, y - (rows * rowH) - 6, W, tableH);
        y += 3;
      };

      // ==========================================
      // DADOS GERAIS
      // ==========================================
      addSection('Dados do Veículo e Viagem');
      addInfoRow([
        ['Placa', data[`${p}placa`] || data.veiculo_placa],
        ['Modelo', (data[`${p}modelo`] || data.veiculo_modelo) + ' ' + (data[`${p}marca`] || data.veiculo_marca || '')],
        ['Cor', data[`${p}cor`] || data.veiculo_cor]
      ]);
      addInfoRow([
        ['Ano', data[`${p}ano`] || data.veiculo_ano],
        ['Motor', data[`${p}motor`] || data.veiculo_motor],
        ['Unidade', data.unidade]
      ]);
      addInfoRow([
        ['Destino', data.destino],
        ['Objetivo', data.objetivo]
      ]);

      y += 2;
      addSection('Condutor / Vistoriador');
      addInfoRow([
        ['Condutor', data.motorista_nome],
        ['CNH/Matrícula', data.motorista_cnh]
      ]);
      addInfoRow([
        ['Vistoriador', data.vistoriador_nome],
        ['Matrícula', data.vistoriador_matricula]
      ]);
      y += 3;

      // ==========================================
      // SAÍDA
      // ==========================================
      if (modo === 'saida' || modo === 'completo') {
        addSection('Vistoria de Saída');
        addInfoRow([
          ['Data', formatDate(data[`${p}saida_data`])],
          ['Hora', formatHora(data[`${p}saida_hora`])],
          ['KM', data[`${p}saida_km`] ? Number(data[`${p}saida_km`]).toLocaleString('pt-BR') : 'N/A']
        ]);
        addInfoRow([
          ['Combustível', data[`${p}saida_combustivel`]]
        ]);
        y += 2;

        let chkSaida = [];
        try {
          chkSaida = typeof data[`${p}saida_checklist`] === 'string'
            ? JSON.parse(data[`${p}saida_checklist`])
            : (data[`${p}saida_checklist`] || []);
        } catch (e) {}

        if (chkSaida.length > 0) {
          addSubSection('Itens Inspecionados — Saída');
          addChecklistTable(chkSaida);
        }

        if (data[`${p}saida_obs`]) {
          checkPage(10);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8);
          doc.text('Observações:', M, y);
          doc.setFont('helvetica', 'normal');
          const lines = doc.splitTextToSize(data[`${p}saida_obs`], W - 25);
          doc.text(lines, M + 25, y);
          y += (lines.length * 4) + 2;
        }
        y += 4;
      }

      // ==========================================
      // ENTRADA
      // ==========================================
      if (modo === 'entrada' || modo === 'completo') {
        if (data[`${p}entrada_data`]) {
          addSection('Vistoria de Entrada');
          addInfoRow([
            ['Data', formatDate(data[`${p}entrada_data`])],
            ['Hora', formatHora(data[`${p}entrada_hora`])],
            ['KM', data[`${p}entrada_km`] ? Number(data[`${p}entrada_km`]).toLocaleString('pt-BR') : 'N/A']
          ]);
          addInfoRow([
            ['Combustível', data[`${p}entrada_combustivel`]]
          ]);
          y += 2;

          let chkEntrada = [];
          try {
            chkEntrada = typeof data[`${p}entrada_checklist`] === 'string'
              ? JSON.parse(data[`${p}entrada_checklist`])
              : (data[`${p}entrada_checklist`] || []);
          } catch (e) {}

          if (chkEntrada.length > 0) {
            addSubSection('Itens Inspecionados — Entrada');
            addChecklistTable(chkEntrada);
          }

          if (data[`${p}entrada_obs`]) {
            checkPage(10);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(8);
            doc.text('Observações:', M, y);
            doc.setFont('helvetica', 'normal');
            const lines = doc.splitTextToSize(data[`${p}entrada_obs`], W - 25);
            doc.text(lines, M + 25, y);
            y += (lines.length * 4) + 2;
          }
          y += 4;
        } else {
          checkPage(10);
          addSection('Vistoria de Entrada');
          doc.setFont('helvetica', 'italic');
          doc.setFontSize(8);
          doc.setTextColor(150, 150, 150);
          doc.text('Vistoria de entrada ainda não realizada.', M + 2, y);
          doc.setTextColor(...PRETO);
          y += 8;
        }
      }

      // ==========================================
      // RESUMO DE UTILIZAÇÃO
      // ==========================================
      if ((modo === 'completo' || modo === 'entrada') && data[`${p}entrada_km`] && data[`${p}saida_km`]) {
        addSection('Resumo de Utilização');

        // Cálculo KM
        let kmRodados = 'N/A';
        const entKm = parseFloat(data[`${p}entrada_km`]);
        const saiKm = parseFloat(data[`${p}saida_km`]);
        if (!isNaN(entKm) && !isNaN(saiKm)) {
          const diff = Math.abs(entKm - saiKm);
          kmRodados = diff.toLocaleString('pt-BR') + ' km';
        }

        // Cálculo tempo
        let tempoStr = 'N/A';
        const saiData = data[`${p}saida_data`];
        const saiHora = data[`${p}saida_hora`] || '00:00';
        const entData = data[`${p}entrada_data`];
        const entHora = data[`${p}entrada_hora`] || '00:00';

        if (entData && saiData) {
          // Parse das datas - podem vir como ISO ou yyyy-mm-dd
          const saiStr = String(saiData).substring(0, 10);
          const entStr = String(entData).substring(0, 10);
          const start = new Date(saiStr + 'T' + formatHora(saiHora) + ':00');
          const end = new Date(entStr + 'T' + formatHora(entHora) + ':00');

          if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
            const diffMs = Math.abs(end.getTime() - start.getTime());
            const totalMinutes = Math.floor(diffMs / 60000);
            const dias = Math.floor(totalMinutes / 1440);
            const horas = Math.floor((totalMinutes % 1440) / 60);
            const mins = totalMinutes % 60;

            const parts = [];
            if (dias > 0) parts.push(dias + (dias === 1 ? ' dia' : ' dias'));
            if (horas > 0) parts.push(horas + (horas === 1 ? ' hora' : ' horas'));
            if (mins > 0) parts.push(mins + ' min');
            tempoStr = parts.length > 0 ? parts.join(', ') : '0 min';
          }
        }

        // Caixa de resumo estilizada
        checkPage(20);
        doc.setFillColor(...AZUL_CLARO);
        doc.roundedRect(M, y, W, 16, 2, 2, 'F');
        doc.setDrawColor(...AZUL);
        doc.roundedRect(M, y, W, 16, 2, 2, 'S');

        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...AZUL);
        doc.text('Total KM Rodado:', M + 8, y + 7);
        doc.text('Tempo de Utilização:', M + W / 2 + 5, y + 7);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        doc.setTextColor(...PRETO);
        doc.text(kmRodados, M + 8, y + 13);
        doc.text(tempoStr, M + W / 2 + 5, y + 13);

        y += 22;
      }

      // ==========================================
      // FOTOS (se houver no BD)
      // ==========================================
      const fotosDoVeiculo = (data.fotos || []).filter(f => {
        const isEmp = f.categoria.endsWith('_emp');
        return t === 'emprestimo' ? isEmp : !isEmp;
      });

      if (fotosDoVeiculo.length > 0) {
        const renderFotos = (titulo, arr) => {
          if (arr.length === 0) return;
          doc.addPage();
          y = 20;
          
          doc.setFillColor(...AZUL);
          doc.rect(M, y, W, 8, 'F');
          doc.setTextColor(...BRANCO);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(11);
          doc.text(`  ANEXO FOTOGRÁFICO — ${titulo}`, M + 2, y + 5.5);
          doc.setTextColor(...PRETO);
          y += 15;

          let col = 0;
          let rowH = 65;
          let imgW = 85;
          
          arr.forEach(foto => {
            if (y > pageH - 70) { doc.addPage(); y = 20; col = 0; }
            const x = col === 0 ? M : M + imgW + 10;
            
            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.text(foto.label || 'Foto', x, y);
            
            if (foto.dados) {
              try {
                doc.addImage(foto.dados, 'JPEG', x, y + 3, imgW, 55);
              } catch (e) {
                console.warn('Erro ao desenhar foto', e);
              }
            }
            
            if (col === 1) { col = 0; y += rowH; } 
            else { col = 1; }
          });
        };

        const entradaGerais = fotosDoVeiculo.filter(f => f.categoria.includes('entrada_') && f.categoria.includes('Gerais'));
        const entradaAvarias = fotosDoVeiculo.filter(f => f.categoria.includes('entrada_') && f.categoria.includes('Avarias'));
        const saidaGerais = fotosDoVeiculo.filter(f => f.categoria.includes('saida_') && f.categoria.includes('Gerais'));
        const saidaAvarias = fotosDoVeiculo.filter(f => f.categoria.includes('saida_') && f.categoria.includes('Avarias'));

        renderFotos('VISTORIA DE ENTRADA — GERAL', entradaGerais);
        renderFotos('VISTORIA DE ENTRADA — AVARIAS', entradaAvarias);
        renderFotos('VISTORIA DE SAÍDA — GERAL', saidaGerais);
        renderFotos('VISTORIA DE SAÍDA — AVARIAS', saidaAvarias);
      }

      // ==========================================
      // ASSINATURAS (No final do documento)
      // ==========================================
      checkPage(45);
      y += 8;

      const assSaidaVist = data[`${p}saida_assinatura_vistoriador`];
      const assEntradaVist = data[`${p}entrada_assinatura_vistoriador`];
      const assinaturaVistoriador = (modo === 'entrada' && assEntradaVist) ? assEntradaVist : (assSaidaVist || assEntradaVist);

      const assSaidaCond = data[`${p}saida_assinatura`];
      const assEntradaCond = data[`${p}entrada_assinatura`];
      const assinaturaCondutor = (modo === 'entrada' && assEntradaCond) ? assEntradaCond : (assSaidaCond || assEntradaCond);

      const leftCenter = M + W / 4;
      const rightCenter = M + (3 * W / 4);

      if (assinaturaCondutor) {
        try { doc.addImage(assinaturaCondutor, 'PNG', leftCenter - 27.5, y - 5, 55, 22); } catch (e) {}
      }
      if (assinaturaVistoriador) {
        try { doc.addImage(assinaturaVistoriador, 'PNG', rightCenter - 27.5, y - 5, 55, 22); } catch (e) {}
      }

      if (assinaturaCondutor || assinaturaVistoriador) {
        y += 20;
      } else {
        y += 15;
      }

      doc.setDrawColor(100, 100, 100);
      doc.setLineWidth(0.3);
      doc.line(leftCenter - 35, y, leftCenter + 35, y);
      doc.line(rightCenter - 35, y, rightCenter + 35, y);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(...CINZA_HEADER);
      doc.text('CONDUTOR', leftCenter, y + 5, { align: 'center' });
      doc.text('VISTORIADOR', rightCenter, y + 5, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.text(data.motorista_nome || '_______________', leftCenter, y + 9, { align: 'center' });
      doc.text(data.vistoriador_nome || '_______________', rightCenter, y + 9, { align: 'center' });

      // ==========================================
      // RODAPÉ
      // ==========================================
      doc.setFontSize(6);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Documento gerado em ${new Date().toLocaleString('pt-BR')} — Checklist #${data.id} — TransporteTJGO v2.0`,
        105, pageH - 8, { align: 'center' }
      );
      doc.setTextColor(...PRETO);
    });

    const fileName = `Checklist_${data.id}_${modo.toUpperCase()}_${Date.now()}.pdf`;
    doc.save(fileName);
    App.hideLoading();
    App.toast('PDF gerado e baixado com sucesso!', 'success');
  } catch (error) {
    App.hideLoading();
    console.error('Erro na geração do PDF:', error);
    throw new Error('Falha na geração do PDF: ' + error.message);
  }
};
