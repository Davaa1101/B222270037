import { api } from './api';

export const adminService = {
  async getDashboard() {
    const response = await api.get('/admin/dashboard');
    return response.data;
  },

  async getUsers(params = {}) {
    const response = await api.get('/admin/users', { params });
    return response.data;
  },

  async updateUserStatus(userId, payload) {
    const response = await api.patch(`/admin/users/${userId}/status`, payload);
    return response.data;
  },

  async getItems(params = {}) {
    const response = await api.get('/admin/items', { params });
    return response.data;
  },

  async removeItem(itemId, reason = '') {
    const response = await api.delete(`/admin/items/${itemId}`, {
      data: { reason }
    });
    return response.data;
  },

  async getReports(params = {}) {
    const response = await api.get('/reports/admin/all', { params });
    return response.data;
  },

  async updateReport(reportId, payload) {
    const response = await api.patch(`/reports/admin/${reportId}`, payload);
    return response.data;
  },

  async getCategories() {
    const response = await api.get('/admin/categories');
    return response.data;
  },

  async createCategory(payload) {
    const response = await api.post('/admin/categories', payload);
    return response.data;
  },

  async updateCategory(categoryId, payload) {
    const response = await api.put(`/admin/categories/${categoryId}`, payload);
    return response.data;
  }
};
