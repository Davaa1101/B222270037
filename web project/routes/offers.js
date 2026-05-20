const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { body, validationResult, query } = require('express-validator');
const Offer = require('../models/Offer');
const Item = require('../models/Item');
const User = require('../models/User');
const { Chat } = require('../models/index');
const { auth } = require('../middleware/auth');
const { sendOfferNotification } = require('../utils/email');

const router = express.Router();

// Configure multer for offer images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = 'uploads/offers';
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 10 // Maximum 10 files for multiple offered items
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images are allowed'));
    }
  }
});

// Create new offer
router.post('/', auth, upload.array('images', 10), [
  body('itemId').isMongoId(),
  body('message').optional().trim().isLength({ max: 500 }),
  body('offeredItems').custom((value) => {
    try {
      const items = JSON.parse(value);
      if (!Array.isArray(items) || items.length === 0) {
        throw new Error('offeredItems must be a non-empty array');
      }
      items.forEach(item => {
        if (!item.title || item.title.trim().length < 3 || item.title.trim().length > 100) {
          throw new Error('Each item must have a title between 3 and 100 characters');
        }
        if (!item.description || item.description.trim().length < 5 || item.description.trim().length > 500) {
          throw new Error('Each item must have a description between 5 and 500 characters');
        }
        if (!['new', 'like_new', 'good', 'fair', 'poor'].includes(item.condition)) {
          throw new Error('Each item must have a valid condition');
        }
      });
      return true;
    } catch (e) {
      throw new Error('Invalid offeredItems format: ' + e.message);
    }
  })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Clean up uploaded files
      if (req.files) {
        req.files.forEach(file => fs.unlink(file.path, () => {}));
      }
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { itemId, message, offeredItems } = req.body;

    // Check if item exists and is active
    const item = await Item.findById(itemId).populate('owner');
    if (!item || item.status !== 'active') {
      if (req.files) {
        req.files.forEach(file => fs.unlink(file.path, () => {}));
      }
      return res.status(404).json({ message: 'Item not found or no longer available' });
    }

    // Check if user is not the owner of the item
    if (item.owner._id.toString() === req.user.userId) {
      if (req.files) {
        req.files.forEach(file => fs.unlink(file.path, () => {}));
      }
      return res.status(400).json({ message: 'Cannot make offer on your own item' });
    }

    // Check if user already has a pending offer for this item
    const existingOffer = await Offer.findOne({
      item: itemId,
      offeredBy: req.user.userId,
      status: 'pending'
    });

    if (existingOffer) {
      if (req.files) {
        req.files.forEach(file => fs.unlink(file.path, () => {}));
      }
      return res.status(400).json({ message: 'You already have a pending offer for this item' });
    }

    // Process uploaded images and distribute them among offered items
    let imageIndex = 0;
    const processedOfferedItems = JSON.parse(offeredItems).map(offeredItem => {
      const itemImages = [];
      const imagesPerItem = Math.ceil((req.files?.length || 0) / JSON.parse(offeredItems).length);
      
      for (let i = 0; i < imagesPerItem && imageIndex < (req.files?.length || 0); i++) {
        const file = req.files[imageIndex];
        itemImages.push({
          url: `/uploads/offers/${file.filename}`,
          filename: file.filename
        });
        imageIndex++;
      }

      return {
        ...offeredItem,
        images: itemImages
      };
    });

    // Create offer
    const offer = new Offer({
      item: itemId,
      offeredBy: req.user.userId,
      offeredTo: item.owner._id,
      offeredItems: processedOfferedItems,
      message: message || ''
    });

    await offer.save();
    await offer.populate(['offeredBy', 'offeredTo', 'item']);

    // Send notification email to item owner
    try {
      await sendOfferNotification(
        item.owner.email,
        item.owner.name,
        item.title,
        message || 'Шинэ санал ирлээ'
      );
    } catch (emailError) {
      console.error('Failed to send offer notification:', emailError);
    }

    res.status(201).json({
      message: 'Offer created successfully',
      offer
    });
  } catch (error) {
    console.error('Create offer error:', error);
    // Clean up uploaded files
    if (req.files) {
      req.files.forEach(file => fs.unlink(file.path, () => {}));
    }
    res.status(500).json({ message: 'Server error during offer creation' });
  }
});

// Get offers for an item (item owner only)
router.get('/item/:itemId', auth, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  query('status').optional().isIn(['pending', 'accepted', 'rejected', 'withdrawn', 'completed'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Invalid query parameters', 
        errors: errors.array() 
      });
    }

    const { itemId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Check if user owns the item
    const item = await Item.findById(itemId);
    if (!item || item.owner.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized to view offers for this item' });
    }

    const filter = { item: itemId };
    if (req.query.status) {
      filter.status = req.query.status;
    }

    const offers = await Offer.find(filter)
      .populate('offeredBy', 'name location profile.rating profile.totalTrades')
      .populate('item', 'title')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);

    const total = await Offer.countDocuments(filter);

    res.json({
      offers,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get item offers error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's sent offers
router.get('/sent', auth, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  query('status').optional().isIn(['pending', 'accepted', 'rejected', 'withdrawn', 'completed'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Invalid query parameters', 
        errors: errors.array() 
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = { offeredBy: req.user.userId };
    if (req.query.status) {
      filter.status = req.query.status;
    }

    const offers = await Offer.find(filter)
      .populate('offeredTo', 'name location')
      .populate('item', 'title images location')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);

    const total = await Offer.countDocuments(filter);

    res.json({
      offers,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get sent offers error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's received offers
router.get('/received', auth, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  query('status').optional().isIn(['pending', 'accepted', 'rejected', 'withdrawn', 'completed'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Invalid query parameters', 
        errors: errors.array() 
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = { offeredTo: req.user.userId };
    if (req.query.status) {
      filter.status = req.query.status;
    }

    const offers = await Offer.find(filter)
      .populate('offeredBy', 'name location profile.rating profile.totalTrades')
      .populate('item', 'title images location')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);

    const total = await Offer.countDocuments(filter);

    res.json({
      offers,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get received offers error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Respond to offer (accept/reject)
router.patch('/:id/respond', auth, [
  body('action').isIn(['accept', 'reject']),
  body('responseMessage').optional().trim().isLength({ max: 500 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { id } = req.params;
    const { action, responseMessage } = req.body;

    const offer = await Offer.findById(id)
      .populate('offeredBy', 'name email')
      .populate('offeredTo', 'name email')
      .populate('item', 'title');

    if (!offer) {
      return res.status(404).json({ message: 'Offer not found' });
    }

    // Check if user is the recipient of the offer
    if (offer.offeredTo._id.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized to respond to this offer' });
    }

    // Check if offer is still pending
    if (offer.status !== 'pending') {
      return res.status(400).json({ message: 'Offer is no longer pending' });
    }

    // Update offer status
    offer.status = action === 'accept' ? 'accepted' : 'rejected';
    offer.responseMessage = responseMessage || '';
    
    if (action === 'accept') {
      // Create chat room for accepted offers
      const chat = new Chat({
        offer: offer._id,
        participants: [offer.offeredBy._id, offer.offeredTo._id],
        messages: [{
          sender: offer.offeredTo._id,
          content: responseMessage || 'Санал хүлээн авагдлаа! Дэлгэрэнгүй ярилцъя.',
          timestamp: new Date()
        }]
      });
      
      await chat.save();
    }

    await offer.save();

    // Send notification to offer sender
    try {
      const notificationMessage = action === 'accept' 
        ? `Таны "${offer.item.title}" зар дээрх санал хүлээн авагдлаа!`
        : `Таны "${offer.item.title}" зар дээрх санал татгалзагдлаа.`;
      
      const { sendNotificationEmail } = require('../utils/email');
      await sendNotificationEmail(
        offer.offeredBy.email,
        offer.offeredBy.name,
        action === 'accept' ? 'Санал хүлээн авагдлаа' : 'Санал татгалзагдлаа',
        notificationMessage + (responseMessage ? `\n\nХариу: ${responseMessage}` : '')
      );
    } catch (emailError) {
      console.error('Failed to send response notification:', emailError);
    }

    res.json({
      message: action === 'accept' ? 'Offer accepted successfully' : 'Offer rejected',
      offer
    });
  } catch (error) {
    console.error('Respond to offer error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Withdraw offer (offer sender only)
router.patch('/:id/withdraw', auth, async (req, res) => {
  try {
    const { id } = req.params;

    const offer = await Offer.findById(id);
    if (!offer) {
      return res.status(404).json({ message: 'Offer not found' });
    }

    // Check if user is the sender of the offer
    if (offer.offeredBy.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized to withdraw this offer' });
    }

    // Check if offer is still pending
    if (offer.status !== 'pending') {
      return res.status(400).json({ message: 'Can only withdraw pending offers' });
    }

    offer.status = 'withdrawn';
    await offer.save();

    res.json({
      message: 'Offer withdrawn successfully',
      offer
    });
  } catch (error) {
    console.error('Withdraw offer error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark offer as completed (both parties can do this)
router.patch('/:id/complete', auth, [
  body('meetingDetails').optional().isObject(),
  body('meetingDetails.location').optional().trim().isLength({ max: 200 }),
  body('meetingDetails.date').optional().isISO8601(),
  body('meetingDetails.notes').optional().trim().isLength({ max: 500 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { id } = req.params;
    const { meetingDetails } = req.body;

    const offer = await Offer.findById(id);
    if (!offer) {
      return res.status(404).json({ message: 'Offer not found' });
    }

    // Check if user is involved in the offer
    const userId = req.user.userId;
    if (offer.offeredBy.toString() !== userId && offer.offeredTo.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized to complete this offer' });
    }

    // Check if offer is accepted
    if (offer.status !== 'accepted') {
      return res.status(400).json({ message: 'Can only complete accepted offers' });
    }

    offer.status = 'completed';
    if (meetingDetails) {
      offer.meetingDetails = meetingDetails;
    }
    
    await offer.save();

    // Update user trade statistics
    await User.findByIdAndUpdate(offer.offeredBy, { 
      $inc: { 'profile.totalTrades': 1 } 
    });
    await User.findByIdAndUpdate(offer.offeredTo, { 
      $inc: { 'profile.totalTrades': 1 } 
    });

    // Mark item as completed
    await Item.findByIdAndUpdate(offer.item, { 
      status: 'completed' 
    });

    res.json({
      message: 'Trade completed successfully',
      offer
    });
  } catch (error) {
    console.error('Complete offer error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Accept offer (simplified endpoint)
router.put('/:id/accept', auth, [
  body('responseMessage').optional().trim().isLength({ max: 500 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { id } = req.params;
    const { responseMessage } = req.body;

    const offer = await Offer.findById(id)
      .populate('offeredBy', 'name email')
      .populate('offeredTo', 'name email')
      .populate('item', 'title');

    if (!offer) {
      return res.status(404).json({ message: 'Offer not found' });
    }

    // Check if user is the recipient of the offer
    if (offer.offeredTo._id.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized to accept this offer' });
    }

    // Check if offer is still pending
    if (offer.status !== 'pending') {
      return res.status(400).json({ message: 'Offer is no longer pending' });
    }

    // Update offer status
    offer.status = 'accepted';
    offer.responseMessage = responseMessage || 'Санал хүлээн авагдлаа!';
    
    // Create chat room for accepted offers
    const chat = new Chat({
      offer: offer._id,
      participants: [offer.offeredBy._id, offer.offeredTo._id],
      messages: [{
        sender: offer.offeredTo._id,
        content: responseMessage || 'Санал хүлээн авагдлаа! Дэлгэрэнгүй ярилцъя.',
        timestamp: new Date()
      }]
    });
    
    await chat.save();
    await offer.save();

    // Send notification to offer sender
    try {
      const { sendNotificationEmail } = require('../utils/email');
      await sendNotificationEmail(
        offer.offeredBy.email,
        offer.offeredBy.name,
        'Санал хүлээн авагдлаа',
        `Таны "${offer.item.title}" зар дээрх санал хүлээн авагдлаа!` + 
        (responseMessage ? `\n\nХариу: ${responseMessage}` : '')
      );
    } catch (emailError) {
      console.error('Failed to send acceptance notification:', emailError);
    }

    res.json({
      message: 'Offer accepted successfully',
      offer
    });
  } catch (error) {
    console.error('Accept offer error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Reject offer (simplified endpoint)
router.put('/:id/reject', auth, [
  body('responseMessage').optional().trim().isLength({ max: 500 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { id } = req.params;
    const { responseMessage } = req.body;

    const offer = await Offer.findById(id)
      .populate('offeredBy', 'name email')
      .populate('offeredTo', 'name email')
      .populate('item', 'title');

    if (!offer) {
      return res.status(404).json({ message: 'Offer not found' });
    }

    // Check if user is the recipient of the offer
    if (offer.offeredTo._id.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized to reject this offer' });
    }

    // Check if offer is still pending
    if (offer.status !== 'pending') {
      return res.status(400).json({ message: 'Offer is no longer pending' });
    }

    // Update offer status
    offer.status = 'rejected';
    offer.responseMessage = responseMessage || 'Баярлалаа, гэхдээ энэ удаад болохгүй байна.';
    
    await offer.save();

    // Send notification to offer sender
    try {
      const { sendNotificationEmail } = require('../utils/email');
      await sendNotificationEmail(
        offer.offeredBy.email,
        offer.offeredBy.name,
        'Санал татгалзагдлаа',
        `Таны "${offer.item.title}" зар дээрх санал татгалзагдлаа.` + 
        (responseMessage ? `\n\nХариу: ${responseMessage}` : '')
      );
    } catch (emailError) {
      console.error('Failed to send rejection notification:', emailError);
    }

    res.json({
      message: 'Offer rejected',
      offer
    });
  } catch (error) {
    console.error('Reject offer error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Complete offer (simplified endpoint)
router.put('/:id/complete', auth, async (req, res) => {
  try {
    const { id } = req.params;

    const offer = await Offer.findById(id);
    if (!offer) {
      return res.status(404).json({ message: 'Offer not found' });
    }

    // Check if user is involved in the offer
    const userId = req.user.userId;
    if (offer.offeredBy.toString() !== userId && offer.offeredTo.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized to complete this offer' });
    }

    // Check if offer is accepted
    if (offer.status !== 'accepted') {
      return res.status(400).json({ message: 'Can only complete accepted offers' });
    }

    offer.status = 'completed';
    await offer.save();

    // Update user trade statistics
    await User.findByIdAndUpdate(offer.offeredBy, { 
      $inc: { 'profile.totalTrades': 1 } 
    });
    await User.findByIdAndUpdate(offer.offeredTo, { 
      $inc: { 'profile.totalTrades': 1 } 
    });

    // Mark item as traded
    await Item.findByIdAndUpdate(offer.item, { 
      status: 'traded' 
    });

    res.json({
      message: 'Trade completed successfully',
      offer
    });
  } catch (error) {
    console.error('Complete offer error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get offer details
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const offer = await Offer.findById(id)
      .populate('offeredBy', 'name location profile.rating profile.totalTrades')
      .populate('offeredTo', 'name location profile.rating profile.totalTrades')
      .populate('item', 'title description images location owner');

    if (!offer) {
      return res.status(404).json({ message: 'Offer not found' });
    }

    // Check if user is involved in the offer
    const userId = req.user.userId;
    if (offer.offeredBy._id.toString() !== userId && 
        offer.offeredTo._id.toString() !== userId &&
        offer.item.owner.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized to view this offer' });
    }

    res.json(offer);
  } catch (error) {
    console.error('Get offer details error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get chat messages for an offer
router.get('/:id/chat', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const offer = await Offer.findById(id);
    if (!offer) {
      return res.status(404).json({ message: 'Offer not found' });
    }

    // Check if user is involved in the offer
    const userId = req.user.userId;
    if (offer.offeredBy.toString() !== userId && offer.offeredTo.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized to view this chat' });
    }

    const chat = await Chat.findOne({ offer: id })
      .populate('messages.sender', 'name');

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Mark messages as read for current user
    chat.messages.forEach(message => {
      if (message.sender._id.toString() !== userId) {
        message.isRead = true;
      }
    });
    
    await chat.save();

    res.json(chat);
  } catch (error) {
    console.error('Get chat error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Send chat message
router.post('/:id/chat', auth, [
  body('content').trim().isLength({ min: 1, max: 1000 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { id } = req.params;
    const { content } = req.body;
    
    const offer = await Offer.findById(id);
    if (!offer) {
      return res.status(404).json({ message: 'Offer not found' });
    }

    // Check if user is involved in the offer and offer is accepted
    const userId = req.user.userId;
    if ((offer.offeredBy.toString() !== userId && offer.offeredTo.toString() !== userId) ||
        offer.status !== 'accepted') {
      return res.status(403).json({ message: 'Not authorized to send messages' });
    }

    let chat = await Chat.findOne({ offer: id });
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    const newMessage = {
      sender: userId,
      content: content,
      timestamp: new Date(),
      isRead: false
    };

    chat.messages.push(newMessage);
    await chat.save();
    await chat.populate('messages.sender', 'name');

    res.status(201).json({
      message: 'Message sent successfully',
      chatMessage: newMessage
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;