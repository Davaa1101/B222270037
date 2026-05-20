const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { body, validationResult, query } = require('express-validator');
const Report = require('../models/Report');
const User = require('../models/User');
const Item = require('../models/Item');
const Offer = require('../models/Offer');
const { auth, adminAuth } = require('../middleware/auth');
const { sendNotificationEmail } = require('../utils/email');

const router = express.Router();

// Configure multer for evidence uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = 'uploads/reports';
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'evidence-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 5 // Maximum 5 evidence files
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|txt/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype) || file.mimetype === 'application/pdf' || file.mimetype === 'text/plain';

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images, PDF, and text files are allowed'));
    }
  }
});

// Create new report
router.post('/', auth, upload.array('evidence', 5), [
  body('reportType').isIn([
    'fraudulent_behavior',
    'inappropriate_content',
    'prohibited_items',
    'spam',
    'no_response',
    'harassment',
    'other'
  ]),
  body('targetType').isIn(['user', 'item', 'offer']),
  body('targetId').isMongoId(),
  body('description').trim().isLength({ min: 10, max: 1000 }),
  body('chatHistory').optional().trim().isLength({ max: 5000 })
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

    const { reportType, targetType, targetId, description, chatHistory } = req.body;

    // Verify target exists
    let targetExists = false;
    switch (targetType) {
      case 'user':
        targetExists = await User.exists({ _id: targetId });
        break;
      case 'item':
        targetExists = await Item.exists({ _id: targetId });
        break;
      case 'offer':
        targetExists = await Offer.exists({ _id: targetId });
        break;
    }

    if (!targetExists) {
      if (req.files) {
        req.files.forEach(file => fs.unlink(file.path, () => {}));
      }
      return res.status(404).json({ message: 'Reported target not found' });
    }

    // Check if user already reported this target
    const existingReport = await Report.findOne({
      reportedBy: req.user.userId,
      targetType,
      targetId,
      status: { $in: ['pending', 'investigating'] }
    });

    if (existingReport) {
      if (req.files) {
        req.files.forEach(file => fs.unlink(file.path, () => {}));
      }
      return res.status(400).json({ 
        message: 'You have already reported this item. Please wait for review.' 
      });
    }

    // Process uploaded evidence
    const evidence = req.files ? req.files.map(file => ({
      url: `/uploads/reports/${file.filename}`,
      filename: file.filename
    })) : [];

    const report = new Report({
      reportedBy: req.user.userId,
      reportType,
      targetType,
      targetId,
      description,
      evidence,
      chatHistory: chatHistory || ''
    });

    await report.save();
    await report.populate('reportedBy', 'name email');

    // Notify admin about new report
    try {
      const adminUsers = await User.find({ role: 'admin' });
      const reportTypeLabels = {
        'fraudulent_behavior': 'Хууран мэхлэх',
        'inappropriate_content': 'Зохисгүй контент',
        'prohibited_items': 'Хориотой бараа',
        'spam': 'Спам',
        'no_response': 'Хариу өгөхгүй',
        'harassment': 'Заналхийлэл',
        'other': 'Бусад'
      };

      const notificationMessage = `
        <p>Шинэ гомдол ирлээ:</p>
        <p><strong>Төрөл:</strong> ${reportTypeLabels[reportType]}</p>
        <p><strong>Объект:</strong> ${targetType} (ID: ${targetId})</p>
        <p><strong>Тайлбар:</strong> ${description}</p>
        <p>Админ панелээс дэлгэрэнгүй шалгана уу.</p>
      `;

      for (const admin of adminUsers) {
        await sendNotificationEmail(
          admin.email,
          admin.name,
          'Шинэ гомдол ирлээ',
          notificationMessage
        );
      }
    } catch (emailError) {
      console.error('Failed to send report notification:', emailError);
    }

    res.status(201).json({
      message: 'Report submitted successfully. We will review it within 24-48 hours.',
      reportId: report._id
    });
  } catch (error) {
    console.error('Create report error:', error);
    // Clean up uploaded files
    if (req.files) {
      req.files.forEach(file => fs.unlink(file.path, () => {}));
    }
    res.status(500).json({ message: 'Server error during report submission' });
  }
});

// Get user's reports
router.get('/my-reports', auth, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  query('status').optional().isIn(['pending', 'investigating', 'resolved', 'dismissed'])
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

    const filter = { reportedBy: req.user.userId };
    if (req.query.status) {
      filter.status = req.query.status;
    }

    const reports = await Report.find(filter)
      .populate('resolvedBy', 'name')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .select('-chatHistory'); // Exclude sensitive chat history from list

    const total = await Report.countDocuments(filter);

    res.json({
      reports,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get user reports error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single report (user can only see their own)
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const report = await Report.findById(id)
      .populate('reportedBy', 'name')
      .populate('resolvedBy', 'name');

    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    // Check if user owns this report or is admin
    if (report.reportedBy._id.toString() !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view this report' });
    }

    res.json(report);
  } catch (error) {
    console.error('Get report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: Get all reports
router.get('/admin/all', auth, adminAuth, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('status').optional().isIn(['pending', 'investigating', 'resolved', 'dismissed']),
  query('reportType').optional().isIn([
    'fraudulent_behavior',
    'inappropriate_content',
    'prohibited_items',
    'spam',
    'no_response',
    'harassment',
    'other'
  ]),
  query('targetType').optional().isIn(['user', 'item', 'offer'])
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
    if (req.query.reportType) filter.reportType = req.query.reportType;
    if (req.query.targetType) filter.targetType = req.query.targetType;

    const reports = await Report.find(filter)
      .populate('reportedBy', 'name email')
      .populate('resolvedBy', 'name')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);

    const total = await Report.countDocuments(filter);

    // Get summary statistics
    const stats = await Report.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const statusStats = {};
    stats.forEach(stat => {
      statusStats[stat._id] = stat.count;
    });

    res.json({
      reports,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      },
      stats: statusStats
    });
  } catch (error) {
    console.error('Get admin reports error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: Update report status
router.patch('/admin/:id', auth, adminAuth, [
  body('status').isIn(['investigating', 'resolved', 'dismissed']),
  body('adminNotes').optional().trim().isLength({ max: 1000 }),
  body('actionTaken').optional().isIn([
    'none',
    'warning_sent',
    'content_removed',
    'user_suspended',
    'user_banned',
    'other'
  ])
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
    const { status, adminNotes, actionTaken } = req.body;

    const report = await Report.findById(id)
      .populate('reportedBy', 'name email')
      .populate('targetId');

    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    // Update report
    report.status = status;
    if (adminNotes) report.adminNotes = adminNotes;
    if (actionTaken) report.actionTaken = actionTaken;
    
    if (status === 'resolved' || status === 'dismissed') {
      report.resolvedBy = req.user.userId;
      report.resolvedAt = new Date();
    }

    await report.save();

    // Execute actions if needed
    if (actionTaken && report.targetType === 'user') {
      const targetUser = await User.findById(report.targetId);
      if (targetUser) {
        switch (actionTaken) {
          case 'warning_sent':
            // Send warning email
            try {
              await sendNotificationEmail(
                targetUser.email,
                targetUser.name,
                'Анхааруулга',
                `Таны үйлдлийн талаар гомдол ирсэн байна. Платформын дүрмийг сахиж ажиллана уу.${adminNotes ? `\n\nТайлбар: ${adminNotes}` : ''}`
              );
            } catch (emailError) {
              console.error('Failed to send warning email:', emailError);
            }
            break;
          
          case 'user_suspended':
            targetUser.status = 'suspended';
            await targetUser.save();
            try {
              await sendNotificationEmail(
                targetUser.email,
                targetUser.name,
                'Данс түр хаалттай',
                `Таны данс түр хаагдлаа. Дэлгэрэнгүйг админтай холбогдоно уу.${adminNotes ? `\n\nШалтгаан: ${adminNotes}` : ''}`
              );
            } catch (emailError) {
              console.error('Failed to send suspension email:', emailError);
            }
            break;
          
          case 'user_banned':
            targetUser.status = 'banned';
            await targetUser.save();
            try {
              await sendNotificationEmail(
                targetUser.email,
                targetUser.name,
                'Данс бүрмөсөн хаалттай',
                `Таны данс бүрмөсөн хаагдлаа.${adminNotes ? `\n\nШалтгаан: ${adminNotes}` : ''}`
              );
            } catch (emailError) {
              console.error('Failed to send ban email:', emailError);
            }
            break;
        }
      }
    }

    if (actionTaken === 'content_removed') {
      if (report.targetType === 'item') {
        await Item.findByIdAndUpdate(report.targetId, { status: 'removed' });
      }
    }

    // Notify reporter about resolution
    try {
      const resolutionMessage = status === 'resolved' 
        ? 'Таны гомдол шийдэгдлээ. Арга хэмжээ авлаа.'
        : 'Таны гомдлыг шалгасны дараа цаашдын арга хэмжээ авах шаардлагагүй гэж үзлээ.';
      
      await sendNotificationEmail(
        report.reportedBy.email,
        report.reportedBy.name,
        'Гомдлын хариу',
        `${resolutionMessage}${adminNotes ? `\n\nТайлбар: ${adminNotes}` : ''}`
      );
    } catch (emailError) {
      console.error('Failed to send resolution notification:', emailError);
    }

    await report.populate('resolvedBy', 'name');

    res.json({
      message: 'Report updated successfully',
      report
    });
  } catch (error) {
    console.error('Update report error:', error);
    res.status(500).json({ message: 'Server error during report update' });
  }
});

// Admin: Get report statistics
router.get('/admin/statistics', auth, adminAuth, async (req, res) => {
  try {
    // Get basic counts
    const totalReports = await Report.countDocuments();
    const pendingReports = await Report.countDocuments({ status: 'pending' });
    const investigatingReports = await Report.countDocuments({ status: 'investigating' });
    const resolvedReports = await Report.countDocuments({ status: 'resolved' });

    // Get reports by type
    const reportsByType = await Report.aggregate([
      {
        $group: {
          _id: '$reportType',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    // Get reports by target type
    const reportsByTarget = await Report.aggregate([
      {
        $group: {
          _id: '$targetType',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get recent reports (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentReports = await Report.countDocuments({ 
      createdAt: { $gte: thirtyDaysAgo } 
    });

    // Get average resolution time
    const resolvedWithTime = await Report.find({
      status: 'resolved',
      resolvedAt: { $exists: true }
    }).select('createdAt resolvedAt');

    let avgResolutionTime = 0;
    if (resolvedWithTime.length > 0) {
      const totalTime = resolvedWithTime.reduce((sum, report) => {
        return sum + (new Date(report.resolvedAt) - new Date(report.createdAt));
      }, 0);
      avgResolutionTime = totalTime / resolvedWithTime.length;
    }

    res.json({
      overview: {
        totalReports,
        pendingReports,
        investigatingReports,
        resolvedReports,
        recentReports,
        avgResolutionHours: Math.round(avgResolutionTime / (1000 * 60 * 60))
      },
      reportsByType,
      reportsByTarget
    });
  } catch (error) {
    console.error('Get report statistics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;