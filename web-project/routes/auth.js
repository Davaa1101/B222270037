const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { auth } = require('../middleware/auth');

const router = express.Router();

const createNotification = async ({ user, type, title, message, link = '' }) => {
  return Notification.create({ user, type, title, message, link });
};

// Register user
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('name').trim().isLength({ min: 1 }),
  body('phone').trim().isLength({ min: 8 }).withMessage('Утасны дугаар хүүхэлттэй байх ёстой')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Шалгалт амжилтгүй', 
        errors: errors.array() 
      });
    }

    const { email, password, name, phone, location } = req.body;

    // Check if user already exists by email
    const existingUserEmail = await User.findOne({ email });
    if (existingUserEmail) {
      return res.status(400).json({ message: 'Энэ и-мэйл хаягаар аль хэдийн бүртгэгдсэн байна' });
    }

    // Check if phone number already exists
    const existingUserPhone = await User.findOne({ phone });
    if (existingUserPhone) {
      return res.status(400).json({ message: 'Энэ утасны дугаараар аль хэдийн бүртгэгдсэн байна' });
    }

    // Create user - no email verification needed
    const user = new User({
      email,
      password,
      name,
      phone,
      location: location || {
        city: 'Улаанбаатар',
        district: 'Unknown'
      },
      isEmailVerified: true  // Set as verified immediately
    });

    await user.save();

    // Generate JWT token for immediate login
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Return user data without password
    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      location: user.location,
      bio: user.bio,
      profilePicture: user.profilePicture,
      rating: user.rating,
      createdAt: user.createdAt
    };

    res.status(201).json({
      message: 'Амжилттай бүртгэгдлээ!',
      token,
      user: userResponse
    });
  } catch (error) {
    console.error('Registration error:', error);
    console.error('Error details:', error.message);
    // Handle duplicate phone number error from MongoDB
    if (error.code === 11000 && error.keyPattern.phone) {
      return res.status(400).json({ 
        message: 'Энэ утасны дугаараар аль хэдийн бүртгэгдсэн байна' 
      });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Шалгалтын алдаа', 
        details: error.message 
      });
    }
    res.status(500).json({ message: 'Бүртгэл хийх үед серверийн алдаа гарлаа', details: error.message });
  }
});


// Login
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').exists()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Шалгалт амжилтгүй', 
        errors: errors.array() 
      });
    }

    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Нэвтрэх мэдээлэл буруу' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Нэвтрэх мэдээлэл буруу' });
    }

    // Check if user is banned or suspended
    if (user.status === 'banned') {
      return res.status(403).json({ message: 'Таны данс бүрмөсөн хаалттай' });
    }
    if (user.status === 'suspended') {
      return res.status(403).json({ message: 'Таны данс түр хугацаагаар хаалттай' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        location: user.location
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Нэвтрэх үед серверийн алдаа гарлаа', details: error.message });
  }
});

// Logout
router.post('/logout', auth, async (req, res) => {
  try {
    // For JWT tokens, we don't need to do anything server-side
    // since tokens are stateless. In a more advanced implementation,
    // you might want to maintain a blacklist of tokens.
    
    res.json({ 
      message: 'Logout successful' 
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Гарах үед серверийн алдаа гарлаа', details: error.message });
  }
});

// Forgot password
router.post('/forgot-password', [
  body('email').isEmail().normalizeEmail()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Зөв и-мэйл хаяг оруулна уу' 
      });
    }

    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      // Don't reveal whether user exists
      return res.json({ message: 'If an account with that email exists, we sent a password reset link.' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    user.passwordResetToken = resetToken;
    user.passwordResetExpires = resetExpires;
    await user.save();

    const resetUrl = `${process.env.BASE_URL}/reset-password/${resetToken}`;
    await createNotification({
      user: user._id,
      type: 'password_reset',
      title: 'Нууц үг сэргээх хүсэлт',
      message: 'Таны нууц үг сэргээх хүсэлт бүртгэгдлээ. Дэлгэрэнгүйг нээгээд шинэ нууц үг тохируулна уу.',
      link: resetUrl
    });

    res.json({
      message: 'Хэрэв тухайн и-мэйлтэй бүртгэл байвал нууц үг сэргээх мэдэгдэл илгээгдлээ.',
      resetUrl
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Серверийн алдаа', details: error.message });
  }
});

// Reset password
router.post('/reset-password/:token', [
  body('password').isLength({ min: 6 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Нууц үг хамгийн багадаа 6 тэмдэгттэй байх ёстой' 
      });
    }

    const { token } = req.params;
    const { password } = req.body;

    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Сэргээх токен буруу эсвэл хугацаа нь дууссан' });
    }

    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Нууц үг сэргээх үед серверийн алдаа гарлаа', details: error.message });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'Хэрэглэгч олдсонгүй' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Серверийн алдаа', details: error.message });
  }
});


module.exports = router;