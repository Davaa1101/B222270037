const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    required: true,
    enum: ['new_offer', 'offer_accepted', 'offer_rejected', 'offer_withdrawn', 'system']
  },
  title: {
    type: String,
    required: true,
    maxlength: 120
  },
  message: {
    type: String,
    required: true,
    maxlength: 500
  },
  link: {
    type: String,
    default: ''
  },
  offer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Offer'
  },
  read: {
    type: Boolean,
    default: false
  },
  readAt: Date
}, {
  timestamps: true
});

notificationSchema.index({ user: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);