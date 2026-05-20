const express = require('express');
const { body, validationResult, query } = require('express-validator');
const User = require('../models/User');
const Item = require('../models/Item');
const Offer = require('../models/Offer');
const Report = require('../models/Report');
const { Category, Setting } = require('../models/index');
const { auth, adminAuth } = require('../middleware/auth');
const { sendNotificationEmail } = require('../utils/email');

const router = express.Router();

// Apply admin auth to all routes
router.use(auth, adminAuth);

// Dashboard statistics
router.get('/dashboard', async (req, res) => {
  try {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Basic counts
    const [
      totalUsers,
      activeUsers,
      totalItems,
      activeItems,
      totalOffers,
      completedTrades,
      pendingReports
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ status: 'active' }),
      Item.countDocuments(),
      Item.countDocuments({ status: 'active' }),
      Offer.countDocuments(),
      Offer.countDocuments({ status: 'completed' }),
      Report.countDocuments({ status: 'pending' })
    ]);

    // Growth metrics
    const [
      newUsersThisWeek,
      newUsersThisMonth,
      newItemsThisWeek,
      newItemsThisMonth,
      newOffersThisWeek,
      newOffersThisMonth
    ] = await Promise.all([
      User.countDocuments({ createdAt: { $gte: oneWeekAgo } }),
      User.countDocuments({ createdAt: { $gte: oneMonthAgo } }),
      Item.countDocuments({ createdAt: { $gte: oneWeekAgo } }),
      Item.countDocuments({ createdAt: { $gte: oneMonthAgo } }),
      Offer.countDocuments({ createdAt: { $gte: oneWeekAgo } }),
      Offer.countDocuments({ createdAt: { $gte: oneMonthAgo } })
    ]);

    // Popular categories
    const popularCategories = await Item.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    // Most active users
    const activeUsersList = await User.find({ status: 'active' })
      .sort({ 'profile.totalTrades': -1 })
      .limit(5)
      .select('name email profile.totalTrades profile.rating');

    // Recent activity
    const recentItems = await Item.find()
      .populate('owner', 'name')
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title category createdAt owner status');

    const recentOffers = await Offer.find()
      .populate('offeredBy', 'name')
      .populate('item', 'title')
      .sort({ createdAt: -1 })
      .limit(5)
      .select('createdAt offeredBy item status');

    res.json({
      overview: {
        totalUsers,
        activeUsers,
        totalItems,
        activeItems,
        totalOffers,
        completedTrades,
        pendingReports
      },
      growth: {
        newUsersThisWeek,
        newUsersThisMonth,
        newItemsThisWeek,
        newItemsThisMonth,
        newOffersThisWeek,
        newOffersThisMonth
      },
      popularCategories,
      activeUsers: activeUsersList,
      recentActivity: {
        recentItems,
        recentOffers
      }
    });
  } catch (error) {
    console.error('Get admin dashboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// User management
router.get('/users', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('status').optional().isIn(['active', 'suspended', 'banned']),
  query('search').optional().isString(),
  query('sort').optional().isIn(['newest', 'oldest', 'name', 'trades'])
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
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Build filter
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.search) {
      filter.$or = [
        { name: new RegExp(req.query.search, 'i') },
        { email: new RegExp(req.query.search, 'i') }
      ];
    }

    // Build sort
    let sort = { createdAt: -1 }; // Default: newest first
    switch (req.query.sort) {
      case 'oldest':
        sort = { createdAt: 1 };
        break;
      case 'name':
        sort = { name: 1 };
        break;
      case 'trades':
        sort = { 'profile.totalTrades': -1 };
        break;
    }

    const users = await User.find(filter)
      .select('-password')
      .sort(sort)
      .limit(limit)
      .skip(skip);

    const total = await User.countDocuments(filter);

    res.json({
      users,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user status
router.patch('/users/:id/status', [
  body('status').isIn(['active', 'suspended', 'banned']),
  body('reason').optional().trim().isLength({ max: 500 })
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
    const { status, reason } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Don't allow changing admin status
    if (user.role === 'admin') {
      return res.status(403).json({ message: 'Cannot change admin user status' });
    }

    const oldStatus = user.status;
    user.status = status;
    await user.save();

    // Send notification to user
    let notificationMessage = '';
    let subject = '';

    switch (status) {
      case 'suspended':
        subject = 'Данс түр хаалттай';
        notificationMessage = 'Таны данс түр хаагдлаа. Дэлгэрэнгүйг админтай холбогдоно уу.';
        break;
      case 'banned':
        subject = 'Данс бүрмөсөн хаалттай';
        notificationMessage = 'Таны данс бүрмөсөн хаагдлаа.';
        break;
      case 'active':
        if (oldStatus !== 'active') {
          subject = 'Данс сэргээгдлээ';
          notificationMessage = 'Таны данс сэргээгдлээ. Та дахин платформ ашиглах боломжтой боллоо.';
        }
        break;
    }

    if (notificationMessage) {
      try {
        await sendNotificationEmail(
          user.email,
          user.name,
          subject,
          notificationMessage + (reason ? `\n\nШалтгаан: ${reason}` : '')
        );
      } catch (emailError) {
        console.error('Failed to send status change notification:', emailError);
      }
    }

    res.json({
      message: 'User status updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        status: user.status
      }
    });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Item management
router.get('/items', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('status').optional().isIn(['active', 'inactive', 'completed', 'removed']),
  query('category').optional().isString(),
  query('search').optional().isString(),
  query('sort').optional().isIn(['newest', 'oldest', 'views'])
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
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Build filter
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.category) filter.category = req.query.category;
    if (req.query.search) {
      filter.$text = { $search: req.query.search };
    }

    // Build sort
    let sort = { createdAt: -1 }; // Default: newest first
    switch (req.query.sort) {
      case 'oldest':
        sort = { createdAt: 1 };
        break;
      case 'views':
        sort = { views: -1, createdAt: -1 };
        break;
    }

    const items = await Item.find(filter)
      .populate('owner', 'name email status')
      .sort(sort)
      .limit(limit)
      .skip(skip);

    const total = await Item.countDocuments(filter);

    res.json({
      items,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get items error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Remove item
router.delete('/items/:id', [
  body('reason').optional().trim().isLength({ max: 500 })
], async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const item = await Item.findById(id).populate('owner', 'name email');
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    // Update item status instead of deleting
    item.status = 'removed';
    await item.save();

    // Notify item owner
    try {
      await sendNotificationEmail(
        item.owner.email,
        item.owner.name,
        'Зар хасагдлаа',
        `Таны "${item.title}" нэртэй зар админаар хасагдлаа.${reason ? `\n\nШалтгаан: ${reason}` : ''}`
      );
    } catch (emailError) {
      console.error('Failed to send item removal notification:', emailError);
    }

    res.json({ message: 'Item removed successfully' });
  } catch (error) {
    console.error('Remove item error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Category management
router.get('/categories', async (req, res) => {
  try {
    const categories = await Category.find().sort({ sortOrder: 1, name: 1 });
    res.json(categories);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/categories', [
  body('name').trim().isLength({ min: 1, max: 50 }),
  body('displayName').trim().isLength({ min: 1, max: 100 }),
  body('description').optional().trim().isLength({ max: 200 }),
  body('icon').optional().trim().isLength({ max: 50 }),
  body('sortOrder').optional().isInt({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { name, displayName, description, icon, sortOrder } = req.body;

    // Check if category name already exists
    const existingCategory = await Category.findOne({ name });
    if (existingCategory) {
      return res.status(400).json({ message: 'Category name already exists' });
    }

    const category = new Category({
      name,
      displayName,
      description,
      icon,
      sortOrder: sortOrder || 0
    });

    await category.save();

    res.status(201).json({
      message: 'Category created successfully',
      category
    });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/categories/:id', [
  body('name').optional().trim().isLength({ min: 1, max: 50 }),
  body('displayName').optional().trim().isLength({ min: 1, max: 100 }),
  body('description').optional().trim().isLength({ max: 200 }),
  body('icon').optional().trim().isLength({ max: 50 }),
  body('sortOrder').optional().isInt({ min: 0 }),
  body('isActive').optional().isBoolean()
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
    const updateData = req.body;

    const category = await Category.findByIdAndUpdate(
      id, 
      updateData, 
      { new: true, runValidators: true }
    );

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.json({
      message: 'Category updated successfully',
      category
    });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// System settings
router.get('/settings', async (req, res) => {
  try {
    const settings = await Setting.find().sort({ key: 1 });
    
    // Convert to key-value object
    const settingsObj = {};
    settings.forEach(setting => {
      settingsObj[setting.key] = {
        value: setting.value,
        type: setting.type,
        description: setting.description
      };
    });

    res.json(settingsObj);
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/settings/:key', [
  body('value').notEmpty(),
  body('description').optional().trim().isLength({ max: 200 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { key } = req.params;
    const { value, description } = req.body;

    const setting = await Setting.findOneAndUpdate(
      { key },
      { value, description },
      { upsert: true, new: true }
    );

    res.json({
      message: 'Setting updated successfully',
      setting
    });
  } catch (error) {
    console.error('Update setting error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Analytics and reports
router.get('/analytics/users', [
  query('period').optional().isIn(['7d', '30d', '90d', '1y'])
], async (req, res) => {
  try {
    const period = req.query.period || '30d';
    const days = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 365;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // User registrations over time
    const userGrowth = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ]);

    // User status distribution
    const statusDistribution = await User.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // User activity (users with items or offers)
    const activeUsersCount = await User.countDocuments({
      $or: [
        { _id: { $in: await Item.distinct('owner') } },
        { _id: { $in: await Offer.distinct('offeredBy') } }
      ]
    });

    res.json({
      userGrowth,
      statusDistribution,
      activeUsersCount,
      totalUsers: await User.countDocuments()
    });
  } catch (error) {
    console.error('Get user analytics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/analytics/items', [
  query('period').optional().isIn(['7d', '30d', '90d', '1y'])
], async (req, res) => {
  try {
    const period = req.query.period || '30d';
    const days = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 365;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Items created over time
    const itemGrowth = await Item.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ]);

    // Category distribution
    const categoryDistribution = await Item.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    // Status distribution
    const statusDistribution = await Item.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      itemGrowth,
      categoryDistribution,
      statusDistribution,
      totalItems: await Item.countDocuments()
    });
  } catch (error) {
    console.error('Get item analytics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Export data
router.get('/export/users', async (req, res) => {
  try {
    const users = await User.find()
      .select('name email phone location status profile createdAt')
      .lean();

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=users.json');
    res.json(users);
  } catch (error) {
    console.error('Export users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/export/items', async (req, res) => {
  try {
    const items = await Item.find()
      .populate('owner', 'name email')
      .select('title description category condition location status views createdAt owner')
      .lean();

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=items.json');
    res.json(items);
  } catch (error) {
    console.error('Export items error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;