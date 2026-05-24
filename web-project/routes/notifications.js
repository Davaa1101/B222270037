const express = require('express');
const { query, validationResult } = require('express-validator');
const Notification = require('../models/Notification');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  query('read').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Хүсэлтийн параметр буруу байна',
        errors: errors.array()
      });
    }

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const filter = { user: req.user.userId };
    if (req.query.read !== undefined) {
      filter.read = req.query.read === 'true';
    }

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .populate('offer', 'status item offeredBy offeredTo');

    const total = await Notification.countDocuments(filter);
    const unreadCount = await Notification.countDocuments({ user: req.user.userId, read: false });

    res.json({
      notifications,
      unreadCount,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ message: 'Серверийн алдаа', details: error.message });
  }
});

router.patch('/:id/read', auth, async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      user: req.user.userId
    });

    if (!notification) {
      return res.status(404).json({ message: 'Мэдэгдэл олдсонгүй' });
    }

    notification.read = true;
    notification.readAt = new Date();
    await notification.save();

    res.json({
      message: 'Мэдэгдэл уншсан гэж тэмдэглэгдлээ',
      notification
    });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({ message: 'Серверийн алдаа', details: error.message });
  }
});

router.patch('/read-all', auth, async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user.userId, read: false },
      { $set: { read: true, readAt: new Date() } }
    );

    res.json({ message: 'Бүх мэдэгдэл уншсан гэж тэмдэглэгдлээ' });
  } catch (error) {
    console.error('Mark all notifications read error:', error);
    res.status(500).json({ message: 'Серверийн алдаа', details: error.message });
  }
});

module.exports = router;