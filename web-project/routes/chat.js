const express = require('express');
const { body, validationResult } = require('express-validator');
const { Chat } = require('../models/index');
const Offer = require('../models/Offer');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Get chat messages for an offer
router.get('/:offerId', auth, async (req, res) => {
  try {
    const { offerId } = req.params;
    
    const offer = await Offer.findById(offerId);
    if (!offer) {
      return res.status(404).json({ message: 'Offer not found' });
    }

    // Check if user is involved in the offer
    const userId = req.user.userId;
    if (offer.offeredBy.toString() !== userId && offer.offeredTo.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized to view this chat' });
    }

    // Check if offer is accepted
    if (offer.status !== 'accepted' && offer.status !== 'completed') {
      return res.status(400).json({ message: 'Chat only available for accepted offers' });
    }

    let chat = await Chat.findOne({ offer: offerId })
      .populate('messages.sender', 'name')
      .populate('participants', 'name location');

    if (!chat) {
      // Create chat if it doesn't exist (for backward compatibility)
      chat = new Chat({
        offer: offerId,
        participants: [offer.offeredBy, offer.offeredTo],
        messages: []
      });
      await chat.save();
      await chat.populate('messages.sender', 'name');
      await chat.populate('participants', 'name location');
    }

    // Mark messages as read for current user
    let hasUnreadMessages = false;
    chat.messages.forEach(message => {
      if (message.sender._id.toString() !== userId && !message.isRead) {
        message.isRead = true;
        hasUnreadMessages = true;
      }
    });
    
    if (hasUnreadMessages) {
      await chat.save();
    }

    // Return just the messages array for simpler frontend handling
    res.json(chat.messages);
  } catch (error) {
    console.error('Get chat error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Send chat message
router.post('/:offerId', auth, [
  body('message').trim().isLength({ min: 1, max: 1000 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { offerId } = req.params;
    const { message } = req.body;
    
    const offer = await Offer.findById(offerId)
      .populate('offeredBy', 'name email')
      .populate('offeredTo', 'name email');
    
    if (!offer) {
      return res.status(404).json({ message: 'Offer not found' });
    }

    // Check if user is involved in the offer and offer is accepted
    const userId = req.user.userId;
    if ((offer.offeredBy._id.toString() !== userId && offer.offeredTo._id.toString() !== userId) ||
        (offer.status !== 'accepted' && offer.status !== 'completed')) {
      return res.status(403).json({ message: 'Not authorized to send messages' });
    }

    let chat = await Chat.findOne({ offer: offerId });
    
    if (!chat) {
      // Create chat if it doesn't exist
      chat = new Chat({
        offer: offerId,
        participants: [offer.offeredBy._id, offer.offeredTo._id],
        messages: []
      });
    }

    const newMessage = {
      sender: userId,
      content: message,
      timestamp: new Date(),
      isRead: false
    };

    chat.messages.push(newMessage);
    await chat.save();
    
    // Populate sender info for the response
    await chat.populate('messages.sender', 'name');

    // Send email notification to the other participant
    try {
      const otherUser = offer.offeredBy._id.toString() === userId ? offer.offeredTo : offer.offeredBy;
      const { sendNotificationEmail } = require('../utils/email');
      
      await sendNotificationEmail(
        otherUser.email,
        otherUser.name,
        'Шинэ мессеж ирлээ',
        `Танд шинэ мессеж ирлээ солилцооны чатанд.\n\nМессеж: ${message.substring(0, 100)}${message.length > 100 ? '...' : ''}`
      );
    } catch (emailError) {
      console.error('Failed to send message notification:', emailError);
    }

    // Return the last message
    const lastMessage = chat.messages[chat.messages.length - 1];
    
    res.status(201).json({
      message: 'Message sent successfully',
      chatMessage: lastMessage
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get unread message count for user
router.get('/unread/count', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Find all chats where user is a participant
    const chats = await Chat.find({ 
      participants: userId 
    });

    let unreadCount = 0;
    chats.forEach(chat => {
      chat.messages.forEach(message => {
        if (message.sender.toString() !== userId && !message.isRead) {
          unreadCount++;
        }
      });
    });

    res.json({ unreadCount });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark all messages in a chat as read
router.put('/:offerId/mark-read', auth, async (req, res) => {
  try {
    const { offerId } = req.params;
    const userId = req.user.userId;
    
    const chat = await Chat.findOne({ offer: offerId });
    
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Check if user is a participant
    if (!chat.participants.some(p => p.toString() === userId)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Mark all messages from other users as read
    let updated = false;
    chat.messages.forEach(message => {
      if (message.sender.toString() !== userId && !message.isRead) {
        message.isRead = true;
        updated = true;
      }
    });

    if (updated) {
      await chat.save();
    }

    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
