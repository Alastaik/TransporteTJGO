// ============================================
// DATABASE.JS — IndexedDB for offline cache
// ============================================
const LocalDB = {
  DB_NAME: 'TransporteTJGO',
  DB_VERSION: 3,
  db: null,

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        // Offline checklists queue
        if (!db.objectStoreNames.contains('checklists_offline')) {
          const store = db.createObjectStore('checklists_offline', { keyPath: 'localId', autoIncrement: true });
          store.createIndex('status', 'status');
          store.createIndex('synced', 'synced');
        }
        // Sync queue for pending operations
        if (!db.objectStoreNames.contains('sync_queue')) {
          const queue = db.createObjectStore('sync_queue', { keyPath: 'id', autoIncrement: true });
          queue.createIndex('type', 'type');
        }
        // Photos cache
        if (!db.objectStoreNames.contains('fotos_cache')) {
          db.createObjectStore('fotos_cache');
        }
        // Legacy migration: keep old fotos store if exists
        if (!db.objectStoreNames.contains('fotos')) {
          db.createObjectStore('fotos');
        }
      };
      request.onsuccess = (e) => {
        this.db = e.target.result;
        resolve(this.db);
      };
      request.onerror = () => reject(new Error('Erro ao abrir IndexedDB'));
    });
  },

  // Generic helpers
  async _tx(storeName, mode = 'readonly') {
    if (!this.db) await this.init();
    return this.db.transaction([storeName], mode).objectStore(storeName);
  },

  async put(storeName, data, key) {
    const store = await this._tx(storeName, 'readwrite');
    return new Promise((resolve) => {
      const req = key !== undefined ? store.put(data, key) : store.put(data);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    });
  },

  async get(storeName, key) {
    const store = await this._tx(storeName);
    return new Promise((resolve) => {
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  },

  async getAll(storeName) {
    const store = await this._tx(storeName);
    return new Promise((resolve) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });
  },

  async delete(storeName, key) {
    const store = await this._tx(storeName, 'readwrite');
    return new Promise((resolve) => {
      const req = store.delete(key);
      req.onsuccess = () => resolve(true);
      req.onerror = () => resolve(false);
    });
  },

  async clear(storeName) {
    const store = await this._tx(storeName, 'readwrite');
    return new Promise((resolve) => {
      const req = store.clear();
      req.onsuccess = () => resolve(true);
      req.onerror = () => resolve(false);
    });
  },

  // Checklist-specific helpers
  async saveChecklistOffline(checklist) {
    checklist.synced = false;
    checklist.savedAt = new Date().toISOString();
    return this.put('checklists_offline', checklist);
  },

  async getUnsyncedChecklists() {
    const all = await this.getAll('checklists_offline');
    return all.filter(c => !c.synced);
  },

  // Photo helpers
  async savePhoto(key, base64) {
    return this.put('fotos_cache', base64, key);
  },

  async getPhoto(key) {
    return this.get('fotos_cache', key);
  },

  // Queue a sync operation
  async queueSync(operation) {
    operation.createdAt = new Date().toISOString();
    return this.put('sync_queue', operation);
  },

  async getPendingSyncs() {
    return this.getAll('sync_queue');
  },

  async removeSyncItem(id) {
    return this.delete('sync_queue', id);
  }
};
