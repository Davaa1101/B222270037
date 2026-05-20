const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reportType: {
    type: String,
    required: true,
    enum: [
      'fraudulent_behavior',
      'inappropriate_content',
      'prohibited_items',
      'spam',
      'no_response',
      'harassment',
      'other'
    ]
  },
  targetType: {
    type: String,
    required: true,
    enum: ['user', 'item', 'offer']
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  description: {
    type: String,
    required: true,
    maxlength: 1000
  },
  evidence: [{
    type: String, // URLs to screenshots or other evidence
    filename: String
  }],
  chatHistory: {
    type: String, // Chat conversation if relevant
    maxlength: 5000
  },
  status: {
    type: String,
    enum: ['pending', 'investigating', 'resolved', 'dismissed'],
    default: 'pending'
  },
  adminNotes: {
    type: String,
    maxlength: 1000
  },
  actionTaken: {
    type: String,
    enum: [
      'none',
      'warning_sent',
      'content_removed',
      'user_suspended',
      'user_banned',
      'other'
    ]
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  resolvedAt: Date
}, {
  timestamps: true
});

// Index for admin dashboard
reportSchema.index({ status: 1, createdAt: -1 });
reportSchema.index({ reportType: 1, status: 1 });
reportSchema.index({ targetType: 1, targetId: 1 });

module.exports = mongoose.model('Report', reportSchema);