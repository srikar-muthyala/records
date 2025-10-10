const express = require('express');
const { body, validationResult } = require('express-validator');
const Record = require('../models/Record');
const Request = require('../models/Request');
const { recordManagerAuth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/record-manager/test
// @desc    Test endpoint for record manager
// @access  Private (Record Manager)
router.get('/test', recordManagerAuth, async (req, res) => {
  try {
    res.json({ message: 'Record Manager routes are working!', user: req.user });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/record-manager/requests
// @desc    Get all requests
// @access  Private (Record Manager)
router.get('/requests', recordManagerAuth, async (req, res) => {
  try {
    const { status, requestType } = req.query;
    
    // Only show requests that are meant for record managers (no targetUser or targetUser is null)
    const baseFilter = { 
      $or: [
        { targetUser: null },
        { targetUser: { $exists: false } }
      ]
    };
    
    // Add status filter if provided
    let query = status ? { ...baseFilter, status } : baseFilter;
    
    // Add requestType filter if provided
    if (requestType) {
      query = { ...query, requestType };
    }
    
    const requests = await Request.find(query)
      .populate('user', 'name email')
      .populate('record', 'title category status fileId employeeId ppoUniqueId branchCode')
      .populate('processedBy', 'name')
      .sort({ createdAt: -1 });
    
    res.json(requests);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/record-manager/requests/:id
// @desc    Approve or reject request
// @access  Private (Record Manager)
router.put('/requests/:id', recordManagerAuth, [
  body('status').isIn(['pending', 'rejected', 'handed_over', 'searching', 'not_traceable', 'awaiting_confirmation']).withMessage('Status must be pending, rejected, handed_over, searching, not_traceable, or awaiting_confirmation'),
  body('adminResponse').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { status, adminResponse } = req.body;

    const request = await Request.findById(req.params.id)
      .populate('user', 'name email')
      .populate('record');

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // Allow status updates for all statuses except already rejected
    if (request.status === 'rejected') {
      return res.status(400).json({ message: 'Request has already been rejected and cannot be changed' });
    }

    request.status = status;
    request.processedBy = req.user._id;
    request.processedAt = new Date();
    request.adminResponse = adminResponse;

    if (status === 'handed_over') {
      // Update the original request to await confirmation
      console.log('Updating original request to await confirmation for record:', request.record._id, 'to user:', request.user._id);
      
      // Update the original request status and response
      request.status = 'awaiting_confirmation';
      request.adminResponse = 'Record has been handed over. Please confirm.';
    }

    await request.save();

    res.json({
      message: `Request ${status} successfully`,
      request
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/record-manager/confirm-return/:requestId
// @desc    Confirm a record return
// @access  Private (Record Manager)
router.put('/confirm-return/:requestId', recordManagerAuth, async (req, res) => {
  try {
    const request = await Request.findById(req.params.requestId)
      .populate('record')
      .populate('user');

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (request.requestType !== 'return') {
      return res.status(400).json({ message: 'This is not a return request' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Request has already been processed' });
    }

    // Update the record to available status
    const record = request.record;
    record.status = 'available';
    record.currentHolder = null;
    record.borrowedDate = null;
    record.returnDate = new Date();
    await record.save();

    // Update the request status
    request.status = 'approved';
    request.processedBy = req.user._id;
    request.processedAt = new Date();
    request.adminResponse = 'Return confirmed. Record is now available.';
    await request.save();

    res.json({
      message: 'Return confirmed successfully',
      record: {
        _id: record._id,
        title: record.title,
        status: record.status,
        currentHolder: record.currentHolder
      }
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/record-manager/dashboard
// @desc    Get dashboard data for record manager
// @access  Private (Record Manager)
router.get('/dashboard', recordManagerAuth, async (req, res) => {
  try {
    console.log('Record Manager Dashboard endpoint hit by user:', req.user?.email);
    // Only count requests meant for record managers
    const recordManagerRequestFilter = {
      $or: [
        { targetUser: null },
        { targetUser: { $exists: false } }
      ]
    };

    const totalRequests = await Request.countDocuments(recordManagerRequestFilter);
    const pendingRequests = await Request.countDocuments({ 
      ...recordManagerRequestFilter,
      status: 'pending',
      requestType: 'borrow'
    });
    const returnRequests = await Request.countDocuments({ 
      ...recordManagerRequestFilter,
      status: 'pending',
      requestType: 'return'
    });
    const approvedRequests = await Request.countDocuments({ 
      ...recordManagerRequestFilter,
      status: 'handed_over' 
    });
    const searchingRequests = await Request.countDocuments({ 
      ...recordManagerRequestFilter,
      status: 'searching' 
    });
    const notTraceableRequests = await Request.countDocuments({ 
      ...recordManagerRequestFilter,
      status: 'not_traceable' 
    });

    res.json({
      totalRequests,
      pendingRequests,
      returnRequests,
      approvedRequests,
      searchingRequests,
      notTraceableRequests
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/record-manager/records
// @desc    Create a new record (Record Manager can add records)
// @access  Private (Record Manager)
router.post('/records', recordManagerAuth, [
  body('title').notEmpty().withMessage('Title is required'),
  body('category').notEmpty().withMessage('Category is required'),
  body('description').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, category, description, branchCode, fileId, employeeId, name, ppoUniqueId, pensionStatus, groupId, mobileNumber } = req.body;

    const record = new Record({
      title,
      category,
      description,
      branchCode,
      fileId,
      employeeId,
      name,
      ppoUniqueId,
      pensionStatus,
      groupId,
      mobileNumber,
      status: 'available'
    });

    await record.save();

    res.status(201).json({
      message: 'Record created successfully',
      record
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
