import { api } from './api';

export const authService = {
  async login(email, password) {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  async signup(userData) {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  async register(userData) {
    return this.signup(userData);
  },

  async validateToken(token) {
    try {
      const response = await api.get('/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.status === 200;
    } catch (error) {
      return false;
    }
  },

  async logout() {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    }
  },

  async getProfile(userId = null) {
    const endpoint = userId ? `/users/${userId}/public` : '/auth/me';
    const response = await api.get(endpoint);
    return response.data;
  },

  async updateProfile(userData) {
    const response = await api.put('/users/profile', userData);
    return response.data;
  }
};