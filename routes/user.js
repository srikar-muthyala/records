const express = require('express');
const { body, validationResult } = require('express-validator');
const Record = require('../models/Record');
const Request = require('../models/Request');
const { auth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/user/records
// @desc    Get all records
// @access  Private
router.get('/records', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', category = '' } = req.query;
    
    const query = {};
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    if (category) {
      query.category = category;
    }

    const records = await Record.find(query)
      .populate('currentHolder', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Record.countDocuments(query);

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
    const records = await Record.find({ currentHolder: req.user._id })
      .sort({ borrowedDate: -1 });

    res.json(records);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/user/return/:recordId
// @desc    Return a record directly
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

    // Directly return the record
    record.currentHolder = null;
    record.status = 'available';
    await record.save();

    res.json({ message: 'Record returned successfully' });
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

    // Update request status
    request.status = 'approved';
    request.processedBy = req.user._id;
    request.processedAt = new Date();
    request.adminResponse = 'Request approved by record holder';
    await request.save();

    // Transfer the record to the requesting user
    const record = await Record.findById(request.record._id);
    record.currentHolder = request.user._id;
    record.status = 'borrowed';
    record.borrowedDate = new Date();
    await record.save();

    res.json({ message: 'Request approved successfully' });
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

module.exports = router;
