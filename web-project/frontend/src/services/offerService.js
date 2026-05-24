import { api } from './api';

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

    const response = await api.post('/offers', formData);
    return response.data;
  },

  // Get offers for a specific item (owner only)
  getItemOffers: async (itemId, status = '') => {
    const params = status ? { status } : {};
    const response = await api.get(`/offers/item/${itemId}`, { params });
    return response.data.offers || [];
  },

  // Get offers sent by current user
  getSentOffers: async (status = '') => {
    const params = status ? { status } : {};
    const response = await api.get('/offers/sent', { params });
    return response.data.offers || [];
  },

  // Get offers received by current user
  getReceivedOffers: async (status = '') => {
    const params = status ? { status } : {};
    const response = await api.get('/offers/received', { params });
    return response.data.offers || [];
  },

  // Get offer details
  getOffer: async (offerId) => {
    const response = await api.get(`/offers/${offerId}`);
    return response.data;
  },

  // Accept an offer
  acceptOffer: async (offerId, responseMessage = '') => {
    const response = await api.put(`/offers/${offerId}/accept`, { responseMessage });
    return response.data;
  },

  // Reject an offer
  rejectOffer: async (offerId, responseMessage = '') => {
    const response = await api.put(`/offers/${offerId}/reject`, { responseMessage });
    return response.data;
  },

  // Mark offer as complete
  completeOffer: async (offerId) => {
    const response = await api.put(`/offers/${offerId}/complete`, {});
    return response.data;
  },

  // Withdraw an offer
  withdrawOffer: async (offerId) => {
    const response = await api.patch(`/offers/${offerId}/withdraw`, {});
    return response.data;
  }
};
