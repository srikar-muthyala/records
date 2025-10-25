const express = require('express');
const { body, validationResult } = require('express-validator');
const Record = require('../models/Record');
const Request = require('../models/Request');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/user/records
// @desc    Get all records
// @access  Private
router.get('/records', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', category = '' } = req.query;
    
    console.log('User records search - search term:', search);
    console.log('User records search - page:', page, 'limit:', limit);
    
    const query = {};
    if (search) {
      // Use text search for better performance on title, description, name
      const textSearch = { $text: { $search: search } };
      
      // Use exact matches for IDs to avoid regex performance issues
      const exactMatches = {
        $or: [
          { employeeId: search },
          { ppoUniqueId: search }
        ]
      };
      
      // Combine text search with exact matches
      query.$or = [textSearch, exactMatches];
    }
    if (category) {
      query.category = category;
    }
    
    console.log('User records search - query:', JSON.stringify(query, null, 2));

    // Add status filter to reduce scanned documents
    if (!query.status) {
      query.status = { $in: ['available', 'borrowed'] };
    }

    const records = await Record.find(query)
      .populate('currentHolder', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Record.countDocuments(query);
    
    console.log('User records search - found records:', records.length);
    console.log('User records search - total:', total);

    res.json({
      records,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/user/records/debug-search
// @desc    Debug search functionality
// @access  Private
router.get('/records/debug-search', auth, async (req, res) => {
  try {
    const { search = '' } = req.query;
    
    console.log('Debug search - search term:', search);
    
    const query = {};
    if (search) {
      // Use text search for better performance on title, description, name
      const textSearch = { $text: { $search: search } };
      
      // Use exact matches for IDs to avoid regex performance issues
      const exactMatches = {
        $or: [
          { employeeId: search },
          { ppoUniqueId: search }
        ]
      };
      
      // Combine text search with exact matches
      query.$or = [textSearch, exactMatches];
    }
    
    console.log('Debug search - query:', JSON.stringify(query, null, 2));
    
    const records = await Record.find(query).limit(5);
    const total = await Record.countDocuments(query);
    
    console.log('Debug search - found records:', records.length);
    console.log('Debug search - total:', total);
    
    res.json({
      searchTerm: search,
      query,
      records: records.map(r => ({
        _id: r._id,
        title: r.title,
        name: r.name,
        employeeId: r.employeeId,
        ppoUniqueId: r.ppoUniqueId
      })),
      total
    });
  } catch (error) {
    console.error('Debug search error:', error);
    res.status(500).json({ message: 'Debug search error', error: error.message });
  }
});

// @route   GET /api/user/records/:id
// @desc    Get single record
// @access  Private
router.get('/records/:id', auth, async (req, res) => {
  try {
    const record = await Record.findById(req.params.id)
      .populate('currentHolder', 'name email');
    
    if (!record) {
      return res.status(404).json({ message: 'Record not found' });
    }

    res.json(record);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/user/requests
// @desc    Create a new request
// @access  Private
router.post('/requests', auth, [
  body('recordId').isMongoId().withMessage('Valid record ID is required'),
  body('message').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { recordId, message } = req.body;

    // Check if record exists
    const record = await Record.findById(recordId);
    if (!record) {
      return res.status(404).json({ message: 'Record not found' });
    }

    // Check if user already has a pending request for this record
    const existingRequest = await Request.findOne({
      user: req.user._id,
      record: recordId,
      status: 'pending'
    });

    if (existingRequest) {
      return res.status(400).json({ message: 'You already have a pending request for this record' });
    }

    // Check if user already has this record
    if (record.currentHolder && record.currentHolder.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'You already have this record' });
    }

    // Determine request type and target
    let requestType = 'borrow';
    let targetUser = null;
    
    if (record.currentHolder) {
      // Record is borrowed, request goes to current holder
      requestType = 'borrow_from_user';
      targetUser = record.currentHolder;
    } else {
      // Record is available, request goes to admin
      requestType = 'borrow';
    }

    // Create request
    const request = new Request({
      user: req.user._id,
      record: recordId,
      message,
      requestType,
      targetUser
    });

    await request.save();

    // Populate the request with user and record details
    await request.populate('user', 'name email');
    await request.populate('record', 'title category status');

    res.status(201).json(request);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/user/my-requests
// @desc    Get user's requests
// @access  Private
router.get('/my-requests', auth, async (req, res) => {
  try {
    const requests = await Request.find({ user: req.user._id })
      .populate('record', 'title category status')
      .populate('processedBy', 'name')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/user/my-records
// @desc    Get records currently held by user
// @access  Private
router.get('/my-records', auth, async (req, res) => {
  try {
    console.log('Fetching my-records for user:', req.user._id);
    const records = await Record.find({ currentHolder: req.user._id })
      .sort({ borrowedDate: -1 });
    
    console.log('Found records for user:', records.length);
    console.log('Records:', records.map(r => ({ id: r._id, title: r.title, status: r.status, currentHolder: r.currentHolder })));

    res.json(records);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/user/users-with-records
// @desc    Get regular users with their record possession counts
// @access  Private
router.get('/users-with-records', auth, async (req, res) => {
  try {
    // Get only regular users (exclude admin and record manager)
    const users = await User.find(
      { role: 'user' }, 
      'name email role isActive lastActivity'
    ).sort({ name: 1 });

    // Get record possession counts for each user
    const usersWithCounts = await Promise.all(
      users.map(async (user) => {
        // Count records currently borrowed by this user
        const recordsInPossession = await Record.countDocuments({
          status: 'borrowed',
          currentHolder: user._id
        });

        return {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
          lastActivity: user.lastActivity,
          recordsInPossession
        };
      })
    );

    res.json(usersWithCounts);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/user/users/:userId/records
// @desc    Get records borrowed by a specific user
// @access  Private
router.get('/users/:userId/records', auth, async (req, res) => {
  try {
    const { userId } = req.params;

    // Verify the user exists and is a regular user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role !== 'user') {
      return res.status(403).json({ message: 'Access denied. Only regular users can be viewed.' });
    }

    // Get records borrowed by this user
    const records = await Record.find({
      status: 'borrowed',
      currentHolder: userId
    })
    .select('title name category employeeId ppoUniqueId branchCode fileId borrowedDate')
    .sort({ borrowedDate: -1 });

    res.json(records);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/user/return/:recordId
// @desc    Request to return a record (requires record manager confirmation)
// @access  Private
router.post('/return/:recordId', auth, async (req, res) => {
  try {
    const record = await Record.findById(req.params.recordId);
    
    if (!record) {
      return res.status(404).json({ message: 'Record not found' });
    }

    if (!record.currentHolder || record.currentHolder.toString() !== req.user._id.toString()) {
      return res.status(400).json({ message: 'You do not have this record' });
    }

    // Create a return request for record manager confirmation
    const returnRequest = new Request({
      user: req.user._id,
      record: record._id,
      status: 'pending',
      requestType: 'return',
      targetUser: null, // Goes to record manager
      message: 'User has returned this record. Please confirm.',
      processedBy: null,
      processedAt: null,
      adminResponse: null
    });

    await returnRequest.save();

    res.json({ message: 'Return request submitted. Awaiting record manager confirmation.' });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/user/categories
// @desc    Get all categories
// @access  Private
router.get('/categories', auth, async (req, res) => {
  try {
    const categories = await Record.distinct('category');
    res.json(categories);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/user/requests-to-me
// @desc    Get requests for user's records
// @access  Private
router.get('/requests-to-me', auth, async (req, res) => {
  try {
    const requests = await Request.find({ 
      targetUser: req.user._id,
      status: 'pending'
    })
      .populate('user', 'name email')
      .populate('record', 'title category status')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/user/requests/:id/approve
// @desc    Approve a request for user's record
// @access  Private
router.put('/requests/:id/approve', auth, async (req, res) => {
  try {
    const request = await Request.findById(req.params.id)
      .populate('user', 'name email')
      .populate('record', 'title category status');

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (request.targetUser.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You are not authorized to approve this request' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Request is not pending' });
    }

    // Update request status to awaiting confirmation
    request.status = 'awaiting_confirmation';
    request.processedBy = req.user._id;
    request.processedAt = new Date();
    request.adminResponse = 'Request approved by record holder. Please confirm receipt of the record.';
    await request.save();

    // Note: Record transfer will happen when user confirms receipt
    // The record remains with the current holder until confirmation

    res.json({ message: 'Request approved successfully. Awaiting confirmation from requester.' });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/user/requests/:id/reject
// @desc    Reject a request for user's record
// @access  Private
router.put('/requests/:id/reject', auth, async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (request.targetUser.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You are not authorized to reject this request' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Request is not pending' });
    }

    // Update request status
    request.status = 'rejected';
    request.processedBy = req.user._id;
    request.processedAt = new Date();
    request.adminResponse = 'Request rejected by record holder';
    await request.save();

    res.json({ message: 'Request rejected successfully' });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/user/change-password
// @desc    Change user password (for password reset)
// @access  Private
router.put('/change-password', auth, [
  body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.newPassword) {
      throw new Error('Password confirmation does not match');
    }
    return true;
  })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { newPassword } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/user/confirm-receipt/:requestId
// @desc    Confirm receipt of a record
// @access  Private
router.put('/confirm-receipt/:requestId', auth, async (req, res) => {
  try {
    const request = await Request.findById(req.params.requestId)
      .populate('record')
      .populate('user');

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (request.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only confirm your own requests' });
    }

    if (request.status !== 'awaiting_confirmation') {
      return res.status(400).json({ message: 'This request is not awaiting confirmation' });
    }

    // Update the record to borrowed status and transfer to requester
    const record = request.record;
    record.status = 'borrowed';
    record.currentHolder = req.user._id;
    record.borrowedDate = new Date();
    await record.save();

    // Update the request status to handed_over
    request.status = 'handed_over';
    request.confirmedAt = new Date();
    await request.save();

    res.json({ 
      message: 'Record receipt confirmed successfully',
      record: {
        id: record._id,
        title: record.title,
        status: record.status,
        borrowedDate: record.borrowedDate
      }
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
