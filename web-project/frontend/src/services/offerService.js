import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_BASE || '/api';

export const offerService = {
  // Create a new offer
  createOffer: async (offerData, images) => {
    const formData = new FormData();
    
    formData.append('itemId', offerData.itemId);
    formData.append('message', offerData.message || '');
    formData.append('offeredItems', JSON.stringify(offerData.offeredItems));
    
    // Add images with their item index
    if (images && images.length > 0) {
      images.forEach((fileList, itemIndex) => {
        fileList.forEach(file => {
          formData.append('images', file);
          formData.append('imageItemIndex', itemIndex);
        });
      });
    }

    const response = await axios.post(`${API_BASE}/offers`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.data;
  },

  // Get offers for a specific item (owner only)
  getItemOffers: async (itemId, status = '') => {
    const params = status ? { status } : {};
    const response = await axios.get(`${API_BASE}/offers/item/${itemId}`, {
      params,
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.data.offers || [];
  },

  // Get offers sent by current user
  getSentOffers: async (status = '') => {
    const params = status ? { status } : {};
    const response = await axios.get(`${API_BASE}/offers/sent`, {
      params,
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.data.offers || [];
  },

  // Get offers received by current user
  getReceivedOffers: async (status = '') => {
    const params = status ? { status } : {};
    const response = await axios.get(`${API_BASE}/offers/received`, {
      params,
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.data.offers || [];
  },

  // Get offer details
  getOffer: async (offerId) => {
    const response = await axios.get(`${API_BASE}/offers/${offerId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.data;
  },

  // Accept an offer
  acceptOffer: async (offerId, responseMessage = '') => {
    const response = await axios.put(`${API_BASE}/offers/${offerId}/accept`, 
      { responseMessage },
      {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      }
    );
    return response.data;
  },

  // Reject an offer
  rejectOffer: async (offerId, responseMessage = '') => {
    const response = await axios.put(`${API_BASE}/offers/${offerId}/reject`, 
      { responseMessage },
      {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      }
    );
    return response.data;
  },

  // Mark offer as complete
  completeOffer: async (offerId) => {
    const response = await axios.put(`${API_BASE}/offers/${offerId}/complete`, 
      {},
      {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      }
    );
    return response.data;
  },

  // Withdraw an offer
  withdrawOffer: async (offerId) => {
    const response = await axios.patch(`${API_BASE}/offers/${offerId}/withdraw`, 
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
