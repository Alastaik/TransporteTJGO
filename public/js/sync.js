// ============================================
// SYNC.JS — Offline → Server Synchronization
// ============================================
const SyncManager = {
  isSyncing: false,
  interval: null,

  start() {
    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.updateStatusUI(true);
      this.syncAll();
    });
    window.addEventListener('offline', () => this.updateStatusUI(false));

    // Initial status
    this.updateStatusUI(navigator.onLine);

    // Periodic sync every 30 seconds when online
    this.interval = setInterval(() => {
      if (navigator.onLine && !this.isSyncing) this.syncAll();
    }, 30000);
  },

  updateStatusUI(online) {
    const el = document.getElementById('connectionStatus');
    if (!el) return;
    if (online) {
      el.classList.remove('visible');
    } else {
      el.classList.add('visible');
    }
  },

  async syncAll() {
    if (this.isSyncing || !navigator.onLine) return;
    this.isSyncing = true;

    try {
      const pending = await LocalDB.getPendingSyncs();
      if (pending.length === 0) { this.isSyncing = false; return; }

      console.log(`🔄 Sincronizando ${pending.length} operações pendentes...`);

      for (const op of pending) {
        try {
          switch (op.type) {
            case 'create_checklist':
              const created = await API.post('/checklists', op.data);
              // Update local reference with server ID
              if (op.localId) {
                const local = await LocalDB.get('checklists_offline', op.localId);
                if (local) {
                  local.serverId = created.id;
                  local.synced = true;
                  await LocalDB.put('checklists_offline', local);
                }
              }
              // Sync photos if any
              if (op.fotos && op.fotos.length > 0) {
                try {
                  const faseQuery = op.fase ? `?fase=${op.fase}` : '';
                  await API.post(`/checklists/${created.id}/fotos${faseQuery}`, { fotos: op.fotos });
                } catch (e) { console.warn('Erro ao sincronizar fotos:', e); }
              }
              break;

            case 'update_checklist':
              await API.put(`/checklists/${op.serverId}`, op.data);
              if (op.fotos && op.fotos.length > 0) {
                try {
                  const faseQuery = op.fase ? `?fase=${op.fase}` : '';
                  await API.post(`/checklists/${op.serverId}/fotos${faseQuery}`, { fotos: op.fotos });
                } catch (e) { console.warn('Erro ao sincronizar fotos:', e); }
              }
              break;

            case 'upload_pdf':
              // Re-create the file blob from base64
              if (op.pdfBase64) {
                const byteChars = atob(op.pdfBase64.split(',')[1] || op.pdfBase64);
                const byteArray = new Uint8Array(byteChars.length);
                for (let i = 0; i < byteChars.length; i++) {
                  byteArray[i] = byteChars.charCodeAt(i);
                }
                const blob = new Blob([byteArray], { type: 'application/pdf' });
                const file = new File([blob], op.fileName || 'checklist.pdf', { type: 'application/pdf' });
                await API.uploadPDF(file, op.checklistId, op.tipoVeiculo);
              }
              break;
          }
          // Remove from queue on success
          await LocalDB.removeSyncItem(op.id);
          console.log(`   ✅ Sincronizado: ${op.type}`);
        } catch (err) {
          console.warn(`   ⚠️ Falha ao sincronizar ${op.type}:`, err.message);
          // Keep in queue for retry
        }
      }
    } catch (err) {
      console.error('Erro na sincronização:', err);
    } finally {
      this.isSyncing = false;
    }
  },

  stop() {
    if (this.interval) clearInterval(this.interval);
  }
};
