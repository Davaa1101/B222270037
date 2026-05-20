import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_BASE || '/api';

export const chatService = {
  // Get chat messages for an offer
  getMessages: async (offerId) => {
    const response = await axios.get(`${API_BASE}/chat/${offerId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.data;
  },

  // Send a message
  sendMessage: async (offerId, message) => {
    const response = await axios.post(`${API_BASE}/chat/${offerId}`, 
      { message },
      {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      }
    );
    return response.data;
  },

  // Get unread message count
  getUnreadCount: async () => {
    const response = await axios.get(`${API_BASE}/chat/unread/count`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.data;
  },

  // Mark messages as read
  markAsRead: async (offerId) => {
    const response = await axios.put(`${API_BASE}/chat/${offerId}/mark-read`, 
      {},
      {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      }
    );
    return response.data;
  }
};
