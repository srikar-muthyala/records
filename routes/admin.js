const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Record = require('../models/Record');
const Request = require('../models/Request');
const { adminAuth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/admin/users
// @desc    Get all users
// @access  Private (Admin)
router.get('/users', adminAuth, async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/admin/users
// @desc    Create a new user
// @access  Private (Admin)
router.post('/users', adminAuth, [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please include a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').isIn(['admin', 'recordManager', 'user']).withMessage('Role must be admin, recordManager, or user')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = new User({ name, email, password, role });
    await user.save();

    res.status(201).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive
      }
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/admin/users/:id
// @desc    Update user
// @access  Private (Admin)
router.put('/users/:id', adminAuth, [
  body('name').optional().notEmpty().withMessage('Name cannot be empty'),
  body('email').optional().isEmail().withMessage('Please include a valid email'),
  body('role').optional().isIn(['admin', 'user']).withMessage('Role must be admin or user'),
  body('password').optional().isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, role, isActive, password } = req.body;
    const updateData = {};

    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (role) updateData.role = role;
    if (typeof isActive === 'boolean') updateData.isActive = isActive;
    
    // Handle password update
    if (password && password.trim() !== '') {
      const bcrypt = require('bcryptjs');
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(password, salt);
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/admin/users/:id
// @desc    Delete user
// @access  Private (Admin)
router.delete('/users/:id', adminAuth, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/dashboard
// @desc    Get dashboard data
// @access  Private (Admin)
router.get('/dashboard', adminAuth, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalRecords = await Record.countDocuments();
    const availableRecords = await Record.countDocuments({ status: 'available' });
    const borrowedRecords = await Record.countDocuments({ status: 'borrowed' });
    // Only count requests meant for record managers/admins
    const recordManagerRequestFilter = {
      $or: [
        { targetUser: null },
        { targetUser: { $exists: false } }
      ]
    };

    const pendingRequests = await Request.countDocuments({ 
      ...recordManagerRequestFilter,
      status: 'pending' 
    });

    const recentRequests = await Request.find({ 
      ...recordManagerRequestFilter,
      status: 'pending' 
    })
      .populate('user', 'name email')
      .populate('record', 'title category')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      stats: {
        totalUsers,
        totalRecords,
        availableRecords,
        borrowedRecords,
        pendingRequests
      },
      recentRequests
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
