// ============================================
// STORAGE MODULE - IndexedDB + localStorage
// ============================================

const DB_NAME = 'ChecklistTJGO';
const DB_VERSION = 2;
const STORE_FOTOS = 'fotos';

let db = null;

function initDB() {
  return new Promise((resolve) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = function(e) {
      const database = e.target.result;
      if (!database.objectStoreNames.contains(STORE_FOTOS)) {
        database.createObjectStore(STORE_FOTOS);
      }
    };
    request.onsuccess = function(e) {
      db = e.target.result;
      resolve(db);
    };
    request.onerror = function() {
      console.error('Erro ao abrir IndexedDB');
      resolve(null);
    };
  });
}

function salvarFoto(id, base64Data) {
  if (!db) return Promise.resolve();
  return new Promise((resolve) => {
    const tx = db.transaction([STORE_FOTOS], 'readwrite');
    const store = tx.objectStore(STORE_FOTOS);
    store.put(base64Data, id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve();
  });
}

function obterFoto(id) {
  return new Promise((resolve) => {
    if (!db) return resolve(null);
    const tx = db.transaction([STORE_FOTOS], 'readonly');
    const store = tx.objectStore(STORE_FOTOS);
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => resolve(null);
  });
}

function limparTodasFotos() {
  if (!db) return Promise.resolve();
  return new Promise((resolve) => {
    const tx = db.transaction([STORE_FOTOS], 'readwrite');
    const store = tx.objectStore(STORE_FOTOS);
    store.clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve();
  });
}

// LocalStorage helpers
function salvarCampo(id, valor) {
  try { localStorage.setItem(id, valor); } catch(e) {}
}

function obterCampo(id) {
  try { return localStorage.getItem(id); } catch(e) { return null; }
}

function limparTodosOsCampos() {
  try { localStorage.clear(); } catch(e) {}
}

// Auto-save: bind all .save-state elements
function ativarAutoSave() {
  document.querySelectorAll('.save-state').forEach(el => {
    const handler = () => salvarCampo(el.id, el.value);
    el.addEventListener('input', handler);
    el.addEventListener('change', handler);
  });
}

// Restore all saved field values
function restaurarCamposSalvos() {
  document.querySelectorAll('.save-state').forEach(el => {
    const val = obterCampo(el.id);
    if (val !== null && val !== undefined) {
      el.value = val;
      if (el.classList.contains('auto-expand')) {
        el.style.height = '';
        el.style.height = el.scrollHeight + 'px';
      }
    }
  });
}
