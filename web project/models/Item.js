const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    maxlength: 1000
  },
  category: {
    type: String,
    required: true,
    enum: [
      'electronics',
      'clothing',
      'books',
      'home_garden',
      'sports_outdoors',
      'toys_games',
      'collectibles',
      'automotive',
      'music_instruments',
      'art_crafts',
      'tools',
      'other'
    ]
  },
  condition: {
    type: String,
    required: true,
    enum: ['new', 'like_new', 'good', 'fair', 'poor']
  },
  images: [{
    url: String,
    filename: String
  }],
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  location: {
    city: {
      type: String,
      required: true
    },
    district: {
      type: String,
      required: true
    },
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  wantedItems: {
    description: {
      type: String,
      required: true,
      maxlength: 500
    },
    categories: [{
      type: String,
      enum: [
        'electronics',
        'clothing',
        'books',
        'home_garden',
        'sports_outdoors',
        'toys_games',
        'collectibles',
        'automotive',
        'music_instruments',
        'art_crafts',
        'tools',
        'other'
      ]
    }]
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'completed', 'removed'],
    default: 'active'
  },
  views: {
    type: Number,
    default: 0
  },
  favorites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  expiresAt: {
    type: Date,
    default: function() {
      return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
    }
  }
}, {
  timestamps: true
});

// Index for search functionality
itemSchema.index({ title: 'text', description: 'text' });
itemSchema.index({ category: 1, status: 1 });
itemSchema.index({ 'location.city': 1, 'location.district': 1 });
itemSchema.index({ owner: 1, status: 1 });
itemSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Item', itemSchema);