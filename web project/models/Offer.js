const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema({
  item: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
    required: true
  },
  offeredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  offeredTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  offeredItems: [{
    title: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    condition: {
      type: String,
      enum: ['new', 'like_new', 'good', 'fair', 'poor'],
      required: true
    },
    images: [{
      url: String,
      filename: String
    }],
    estimatedValue: Number
  }],
  message: {
    type: String,
    maxlength: 500
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'withdrawn', 'completed'],
    default: 'pending'
  },
  responseMessage: {
    type: String,
    maxlength: 500
  },
  meetingDetails: {
    location: String,
    date: Date,
    notes: String
  },
  expiresAt: {
    type: Date,
    default: function() {
      return new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
    }
  }
}, {
  timestamps: true
});

// Index for efficient querying
offerSchema.index({ item: 1, status: 1 });
offerSchema.index({ offeredBy: 1, status: 1 });
offerSchema.index({ offeredTo: 1, status: 1 });
offerSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Offer', offerSchema);