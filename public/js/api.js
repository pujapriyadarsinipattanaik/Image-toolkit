/**
 * PIXORA AI - API SERVICE CLIENT MODULE
 */

const API_BASE_URL = '/api';

class ApiService {
  static getToken() {
    return localStorage.getItem('pixora_ai_token') || '';
  }

  static setToken(token) {
    if (token) {
      localStorage.setItem('pixora_ai_token', token);
    } else {
      localStorage.removeItem('pixora_ai_token');
    }
  }

  static getHeaders(isMultipart = false) {
    const headers = {};
    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    if (!isMultipart) {
      headers['Content-Type'] = 'application/json';
    }
    return headers;
  }

  static async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = this.getHeaders(options.isMultipart);

    const config = {
      method: options.method || 'GET',
      headers: {
        ...headers,
        ...(options.headers || {})
      }
    };

    if (options.body) {
      config.body = options.isMultipart ? options.body : JSON.stringify(options.body);
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'API request failed');
      }

      return data;
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error.message);
      throw error;
    }
  }

  // Auth Endpoints
  static register(userData) {
    return this.request('/auth/register', { method: 'POST', body: userData });
  }

  static login(credentials) {
    return this.request('/auth/login', { method: 'POST', body: credentials });
  }

  static getMe() {
    return this.request('/auth/me');
  }

  // AI Generator Endpoints
  static generateAiImage(payload) {
    return this.request('/ai/generate', { method: 'POST', body: payload });
  }

  static enhancePrompt(prompt) {
    return this.request('/ai/enhance-prompt', { method: 'POST', body: { prompt } });
  }

  // Image Management Endpoints
  static uploadImage(formData) {
    return this.request('/images/upload', { method: 'POST', body: formData, isMultipart: true });
  }

  static saveEditedImage(payload) {
    return this.request('/images/save-edited', { method: 'POST', body: payload });
  }

  static getHistory() {
    return this.request('/images/history');
  }

  static getStats() {
    return this.request('/images/stats');
  }

  static deleteImage(id) {
    return this.request(`/images/${id}`, { method: 'DELETE' });
  }

  // Utility Suite Endpoints
  static convertFormat(formData) {
    return this.request('/utility/convert', { method: 'POST', body: formData, isMultipart: true });
  }

  static compressImage(formData) {
    return this.request('/utility/compress', { method: 'POST', body: formData, isMultipart: true });
  }

  static resizeImage(formData) {
    return this.request('/utility/resize', { method: 'POST', body: formData, isMultipart: true });
  }

  static rotateFlipImage(formData) {
    return this.request('/utility/rotate-flip', { method: 'POST', body: formData, isMultipart: true });
  }

  static cropImage(formData) {
    return this.request('/utility/crop', { method: 'POST', body: formData, isMultipart: true });
  }

  static convertToBase64(formData) {
    return this.request('/utility/base64', { method: 'POST', body: formData, isMultipart: true });
  }
}

window.ApiService = ApiService;
