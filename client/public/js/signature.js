// ============================================
// SIGNATURE MODULE - Canvas digital signature
// ============================================

let canvas, ctx, drawing = false;

function initSignature() {
  canvas = document.getElementById('signatureCanvas');
  if (!canvas) return;
  ctx = canvas.getContext('2d');

  // Mouse events
  canvas.addEventListener('mousedown', e => { drawing = true; const p = getPos(e); ctx.beginPath(); ctx.moveTo(p.x, p.y); });
  canvas.addEventListener('mousemove', e => { if (!drawing) return; const p = getPos(e); ctx.lineTo(p.x, p.y); ctx.stroke(); });
  canvas.addEventListener('mouseup', () => drawing = false);
  canvas.addEventListener('mouseleave', () => drawing = false);

  // Touch events
  canvas.addEventListener('touchstart', e => { drawing = true; const p = getPos(e); ctx.beginPath(); ctx.moveTo(p.x, p.y); e.preventDefault(); }, { passive: false });
  canvas.addEventListener('touchmove', e => { if (!drawing) return; const p = getPos(e); ctx.lineTo(p.x, p.y); ctx.stroke(); e.preventDefault(); }, { passive: false });
  canvas.addEventListener('touchend', () => drawing = false);
}

function resizeCanvas() {
  if (!canvas || !ctx) return;
  const ratio = window.devicePixelRatio || 1;
  canvas.width = canvas.offsetWidth * ratio;
  canvas.height = 240 * ratio;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(ratio, ratio);
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#000';
}

function getPos(e) {
  const r = canvas.getBoundingClientRect();
  if (e.touches && e.touches.length > 0) {
    return { x: e.touches[0].clientX - r.left, y: e.touches[0].clientY - r.top };
  }
  return { x: e.clientX - r.left, y: e.clientY - r.top };
}

let currentSignTarget = 'signaturePreview';

function openSign(targetId = 'signaturePreview') {
  currentSignTarget = targetId;
  document.getElementById('signModal').style.display = 'flex';
  setTimeout(resizeCanvas, 150);
}

function closeSign() {
  document.getElementById('signModal').style.display = 'none';
}

function saveSign() {
  if (!canvas) return;
  const dataURL = canvas.toDataURL('image/png');
  const preview = document.getElementById(currentSignTarget);
  if (preview) preview.src = dataURL;
  try { salvarCampo(currentSignTarget + 'Base64', dataURL); } catch(e) {}
  closeSign();
}

function clearSign() {
  if (!ctx || !canvas) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const preview = document.getElementById(currentSignTarget);
  if (preview) preview.src = '';
  try { localStorage.removeItem(currentSignTarget + 'Base64'); } catch(e) {}
}

function restaurarAssinatura() {
  const assinaturaSalva = obterCampo('assinaturaBase64');
  if (assinaturaSalva) {
    const preview = document.getElementById('signaturePreview');
    if (preview) preview.src = assinaturaSalva;
  }
}
