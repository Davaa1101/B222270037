import { api } from './api';

export const chatService = {
  // Get chat messages for an offer
  getMessages: async (offerId) => {
    const response = await api.get(`/chat/${offerId}`);
    return response.data;
  },

  // Send a message
  sendMessage: async (offerId, message) => {
    const response = await api.post(`/chat/${offerId}`, { message });
    return response.data;
  },

  // Get unread message count
  getUnreadCount: async () => {
    const response = await api.get('/chat/unread/count');
    return response.data;
  },

  // Mark messages as read
  markAsRead: async (offerId) => {
    const response = await api.put(`/chat/${offerId}/mark-read`, {});
    return response.data;
  }
};
