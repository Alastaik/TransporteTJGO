// ============================================
// API.JS — HTTP Client for backend API
// ============================================
const API = {
  baseUrl: '/api/v1',

  _getHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    const token = Auth.getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  },

  async request(method, endpoint, body = null) {
    const opts = { method, headers: this._getHeaders() };
    if (body && method !== 'GET') {
      opts.body = JSON.stringify(body);
    }

    const res = await fetch(`${this.baseUrl}${endpoint}`, opts);

    if (res.status === 401) {
      Auth.handleUnauthorized();
      throw new Error('Não autorizado');
    }

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro na requisição');
    return data;
  },

  get(endpoint) { return this.request('GET', endpoint); },
  post(endpoint, body) { return this.request('POST', endpoint, body); },
  put(endpoint, body) { return this.request('PUT', endpoint, body); },
  delete(endpoint) { return this.request('DELETE', endpoint); },

  // Upload file (special handling for multipart)
  async uploadPDF(file, checklistId, tipoVeiculo) {
    const formData = new FormData();
    formData.append('pdf', file);
    formData.append('checklist_id', checklistId);
    formData.append('tipo_veiculo', tipoVeiculo);

    const res = await fetch(`${this.baseUrl}/pdfs/upload`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${Auth.getToken()}` },
      body: formData
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro no upload');
    return data;
  },

  async uploadFoto(file, checklistId) {
    const formData = new FormData();
    formData.append('foto', file);
    formData.append('checklist_id', checklistId);

    const res = await fetch(`${this.baseUrl}/fotos/upload`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${Auth.getToken()}` },
      body: formData
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro no upload da foto');
    return data;
  },

  // Check if server is reachable
  async isOnline() {
    try {
      const res = await fetch('/api/health', { method: 'GET', cache: 'no-cache' });
      return res.ok;
    } catch {
      return false;
    }
  }
};
