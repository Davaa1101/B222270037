const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { body, validationResult, query } = require('express-validator');
const Item = require('../models/Item');
const User = require('../models/User');
const { Category } = require('../models/index');
const { auth, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = 'uploads/items';
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
    files: 5 // Maximum 5 files
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

// Get all items with filtering and pagination
router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  query('category').optional().isString(),
  query('city').optional().isString(),
  query('district').optional().isString(),
  query('search').optional().isString(),
  query('sort').optional().isIn(['newest', 'oldest', 'views'])
], optionalAuth, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Invalid query parameters', 
        errors: errors.array() 
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    // Build filter
    const filter = { status: 'active' };
    
    if (req.query.category) {
      filter.category = req.query.category;
    }
    
    if (req.query.city) {
      filter['location.city'] = new RegExp(req.query.city, 'i');
    }
    
    if (req.query.district) {
      filter['location.district'] = new RegExp(req.query.district, 'i');
    }
    
    if (req.query.search) {
      filter.$text = { $search: req.query.search };
    }

    // Build sort
    let sort = { createdAt: -1 }; // Default: newest first
    if (req.query.sort === 'oldest') {
      sort = { createdAt: 1 };
    } else if (req.query.sort === 'views') {
      sort = { views: -1, createdAt: -1 };
    }

    const items = await Item.find(filter)
      .populate('owner', 'name location.city location.district profile.rating profile.totalTrades')
      .sort(sort)
      .limit(limit)
      .skip(skip)
      .lean();

    const total = await Item.countDocuments(filter);

    // Transform items for frontend compatibility
    const transformedItems = items.map(item => ({
      ...item,
      lookingFor: item.wantedItems?.description || '',
      // Keep both for backward compatibility
      wantedItems: item.wantedItems
    }));

    // Add favorite status if user is authenticated
    if (req.user) {
      transformedItems.forEach(item => {
        item.isFavorited = item.favorites.includes(req.user.userId);
      });
    }

    res.json({
      items: transformedItems,
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

// Get current user's own items (must come before /:id route)
router.get('/my', auth, async (req, res) => {
  try {
    const items = await Item.find({ owner: req.user.userId })
      .sort({ createdAt: -1 })
      .populate('owner', 'name');

    res.json(items);
  } catch (error) {
    console.error('Get my items error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single item by ID
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id)
      .populate('owner', 'name phone location profile.rating profile.totalTrades profile.joinedDate')
      .lean();

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    // Increment view count (only if not owner)
    if (!req.user || req.user.userId.toString() !== item.owner._id.toString()) {
      await Item.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });
      item.views += 1;
    }

    // Transform item for frontend compatibility
    const transformedItem = {
      ...item,
      lookingFor: item.wantedItems?.description || '',
      // Keep both for backward compatibility
      wantedItems: item.wantedItems
    };

    // Add favorite status if user is authenticated
    if (req.user) {
      transformedItem.isFavorited = transformedItem.favorites.includes(req.user.userId);
      transformedItem.canContact = req.user.userId.toString() !== transformedItem.owner._id.toString();
    } else {
      transformedItem.canContact = false;
      // Hide owner contact info for guests
      delete transformedItem.owner.phone;
    }

    res.json(transformedItem);
  } catch (error) {
    console.error('Get item error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid item ID' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new item
router.post('/', auth, upload.array('images', 5), [
  body('title').trim().isLength({ min: 3, max: 100 }),
  body('description').trim().isLength({ min: 10, max: 1000 }),
  body('category').isIn([
    'electronics', 'clothing', 'books', 'home_garden', 'sports_outdoors',
    'toys_games', 'collectibles', 'automotive', 'music_instruments', 
    'art_crafts', 'tools', 'other'
  ]),
  body('condition').isIn(['new', 'like_new', 'good', 'fair', 'poor']),
  body('location.city').trim().isLength({ min: 1 }),
  body('location.district').trim().isLength({ min: 1 }),
  body('wantedItems.description').trim().isLength({ min: 5, max: 500 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Delete uploaded files if validation fails
      if (req.files) {
        req.files.forEach(file => {
          fs.unlink(file.path, () => {});
        });
      }
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { title, description, category, condition } = req.body;

    // Process uploaded images
    const images = req.files ? req.files.map(file => ({
      url: `/uploads/items/${file.filename}`,
      filename: file.filename
    })) : [];

    // Reconstruct nested objects from flattened request body
    const location = {
      city: req.body['location.city'],
      district: req.body['location.district']
    };

    const wantedItems = {
      description: req.body['wantedItems.description'],
      categories: req.body['wantedItems.categories'] ? JSON.parse(req.body['wantedItems.categories']) : []
    };

    const item = new Item({
      title,
      description,
      category,
      condition,
      images,
      owner: req.user.userId,
      location,
      wantedItems
    });

    await item.save();
    await item.populate('owner', 'name location.city location.district');

    res.status(201).json({
      message: 'Item created successfully',
      item
    });
  } catch (error) {
    console.error('Create item error:', error);
    // Clean up uploaded files
    if (req.files) {
      req.files.forEach(file => {
        fs.unlink(file.path, () => {});
      });
    }
    res.status(500).json({ message: 'Server error during item creation' });
  }
});

// Update item
router.put('/:id', auth, upload.array('newImages', 5), [
  body('title').optional().trim().isLength({ min: 3, max: 100 }),
  body('description').optional().trim().isLength({ min: 10, max: 1000 }),
  body('category').optional().isIn([
    'electronics', 'clothing', 'books', 'home_garden', 'sports_outdoors',
    'toys_games', 'collectibles', 'automotive', 'music_instruments', 
    'art_crafts', 'tools', 'other'
  ]),
  body('condition').optional().isIn(['new', 'like_new', 'good', 'fair', 'poor'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    // Check ownership
    if (item.owner.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized to update this item' });
    }

    // Update fields
    const updateFields = {};
    const allowedFields = ['title', 'description', 'category', 'condition'];
    
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateFields[field] = req.body[field];
      }
    });

    // Handle nested location object
    if (req.body['location.city'] || req.body['location.district']) {
      updateFields.location = {
        city: req.body['location.city'] || item.location.city,
        district: req.body['location.district'] || item.location.district
      };
    }

    // Handle nested wantedItems object
    if (req.body['wantedItems.description'] || req.body['wantedItems.categories']) {
      updateFields.wantedItems = {
        description: req.body['wantedItems.description'] || item.wantedItems.description,
        categories: req.body['wantedItems.categories'] ? 
          JSON.parse(req.body['wantedItems.categories']) : 
          item.wantedItems.categories
      };
    }

    // Handle image updates
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(file => ({
        url: `/uploads/items/${file.filename}`,
        filename: file.filename
      }));
      
      // Add new images to existing ones (up to 5 total)
      const totalImages = [...item.images, ...newImages];
      if (totalImages.length > 5) {
        // Remove oldest images if exceeding limit
        const imagesToRemove = totalImages.slice(0, totalImages.length - 5);
        imagesToRemove.forEach(img => {
          const filePath = path.join(__dirname, '..', img.url);
          fs.unlink(filePath, () => {});
        });
        updateFields.images = totalImages.slice(-5);
      } else {
        updateFields.images = totalImages;
      }
    }

    const updatedItem = await Item.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true, runValidators: true }
    ).populate('owner', 'name location.city location.district');

    res.json({
      message: 'Item updated successfully',
      item: updatedItem
    });
  } catch (error) {
    console.error('Update item error:', error);
    res.status(500).json({ message: 'Server error during item update' });
  }
});

// Delete item
router.delete('/:id', auth, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    // Check ownership
    if (item.owner.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized to delete this item' });
    }

    // Delete associated images
    item.images.forEach(image => {
      const filePath = path.join(__dirname, '..', image.url);
      fs.unlink(filePath, () => {});
    });

    await Item.findByIdAndDelete(req.params.id);

    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Delete item error:', error);
    res.status(500).json({ message: 'Server error during item deletion' });
  }
});

// Toggle favorite item
router.post('/:id/favorite', auth, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    const userId = req.user.userId;
    const isFavorited = item.favorites.includes(userId);

    if (isFavorited) {
      item.favorites.pull(userId);
    } else {
      item.favorites.push(userId);
    }

    await item.save();

    res.json({
      message: isFavorited ? 'Removed from favorites' : 'Added to favorites',
      isFavorited: !isFavorited
    });
  } catch (error) {
    console.error('Toggle favorite error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's own items with pagination
router.get('/user/my-items', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const items = await Item.find({ owner: req.user.userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .populate('owner', 'name');

    const total = await Item.countDocuments({ owner: req.user.userId });

    res.json({
      items,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total
      }
    });
  } catch (error) {
    console.error('Get user items error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get categories
router.get('/config/categories', async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true })
      .sort({ sortOrder: 1, name: 1 })
      .select('name displayName sortOrder icon');
    
    console.log(`Found ${categories.length} categories in database`);
    
    // Format for frontend
    const formattedCategories = categories.map(cat => ({
      value: cat.name,
      label: cat.displayName,
      icon: cat.icon || 'fas fa-tag'
    }));

    res.json(formattedCategories);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch categories',
      message: error.message 
    });
  }
});

module.exports = router;