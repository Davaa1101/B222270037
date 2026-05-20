import { api } from './api';

export const itemService = {
  // Get all items with optional search/filter parameters
  async getItems(params = {}) {
    const response = await api.get('/items', { params });
    return response.data;
  },

  async getAllItems(params = {}) {
    return this.getItems(params);
  },

  // Get single item by ID
  async getItem(id) {
    const response = await api.get(`/items/${id}`);
    return response.data;
  },

  // Get current user's items
  async getMyItems() {
    const response = await api.get('/items/my');
    return response.data;
  },

  // Get items by specific user ID
  async getUserItems(userId) {
    const response = await api.get(`/users/${userId}/items`);
    return response.data;
  },

  // Create item with just data (no images)
  async createItem(itemData) {
    // Handle nested objects for JSON submission
    const processedData = {
      ...itemData,
      'location.city': itemData.location?.city,
      'location.district': itemData.location?.district,
      'wantedItems.description': itemData.wantedItems?.description,
      'wantedItems.categories': JSON.stringify(itemData.wantedItems?.categories || [])
    };
    
    // Remove nested objects since we've flattened them
    delete processedData.location;
    delete processedData.wantedItems;
    
    const response = await api.post('/items', processedData);
    return response.data;
  },

  // Create item with images
  async createItemWithImages(itemData, imageFiles) {
    const formData = new FormData();
    
    // Handle nested objects properly for FormData
    const flattenedData = {
      title: itemData.title,
      description: itemData.description,
      category: itemData.category,
      condition: itemData.condition,
      'location.city': itemData.location?.city,
      'location.district': itemData.location?.district,
      'wantedItems.description': itemData.wantedItems?.description,
      'wantedItems.categories': JSON.stringify(itemData.wantedItems?.categories || [])
    };
    
    // Append flattened item data
    Object.keys(flattenedData).forEach(key => {
      if (flattenedData[key] !== undefined && flattenedData[key] !== null) {
        formData.append(key, flattenedData[key]);
      }
    });

    // Append image files
    imageFiles.forEach(file => {
      formData.append('images', file);
    });

    const response = await api.post('/items', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Update item with just data (no images)
  async updateItem(itemId, itemData) {
    // Handle nested objects for JSON submission
    const processedData = {
      ...itemData,
      'location.city': itemData.location?.city,
      'location.district': itemData.location?.district,
      'wantedItems.description': itemData.wantedItems?.description,
      'wantedItems.categories': JSON.stringify(itemData.wantedItems?.categories || [])
    };
    
    // Remove nested objects since we've flattened them
    delete processedData.location;
    delete processedData.wantedItems;
    
    const response = await api.put(`/items/${itemId}`, processedData);
    return response.data;
  },

  // Update item with images
  async updateItemWithImages(itemId, itemData, imageFiles) {
    const formData = new FormData();
    
    // Handle nested objects properly for FormData
    const flattenedData = {
      title: itemData.title,
      description: itemData.description,
      category: itemData.category,
      condition: itemData.condition,
      'location.city': itemData.location?.city,
      'location.district': itemData.location?.district,
      'wantedItems.description': itemData.wantedItems?.description,
      'wantedItems.categories': JSON.stringify(itemData.wantedItems?.categories || [])
    };
    
    // Append flattened item data
    Object.keys(flattenedData).forEach(key => {
      if (flattenedData[key] !== undefined && flattenedData[key] !== null) {
        formData.append(key, flattenedData[key]);
      }
    });

    // Append image files
    imageFiles.forEach(file => {
      formData.append('images', file);
    });

    const response = await api.put(`/items/${itemId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Update item status only
  async updateItemStatus(itemId, status) {
    const response = await api.patch(`/items/${itemId}/status`, { status });
    return response.data;
  },

  async deleteItem(itemId) {
    const response = await api.delete(`/items/${itemId}`);
    return response.data;
  },

  async getCategories() {
    const response = await api.get('/items/config/categories');
    return response.data;
  },

  async searchItems(query) {
    const response = await api.get('/items', { params: query });
    return response.data;
  },

  // Toggle favorite/bookmark an item
  async toggleFavorite(itemId) {
    const response = await api.post(`/items/${itemId}/favorite`);
    return response.data;
  },

  // Get user's favorite items
  async getFavorites() {
    const response = await api.get('/users/favorites');
    return response.data;
  }
};