const express = require('express');
const { body, validationResult } = require('express-validator');
const Record = require('../models/Record');
const Request = require('../models/Request');
const { recordManagerAuth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/record-manager/requests
// @desc    Get all requests
// @access  Private (Record Manager)
router.get('/requests', recordManagerAuth, async (req, res) => {
  try {
    // Only show requests that are meant for record managers (no targetUser or targetUser is null)
    const requests = await Request.find({ 
      $or: [
        { targetUser: null },
        { targetUser: { $exists: false } }
      ]
    })
      .populate('user', 'name email')
      .populate('record', 'title category status fileId')
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
  body('status').isIn(['pending', 'rejected', 'handed_over', 'searching', 'not_traceable']).withMessage('Status must be pending, rejected, handed_over, searching, or not_traceable'),
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
      // Update record status when handed over
      console.log('Handing over record:', request.record._id, 'to user:', request.user._id);
      request.record.status = 'borrowed';
      request.record.currentHolder = request.user._id;
      request.record.borrowedDate = new Date();
      await request.record.save();
      console.log('Record updated successfully:', {
        recordId: request.record._id,
        status: request.record.status,
        currentHolder: request.record.currentHolder,
        borrowedDate: request.record.borrowedDate
      });
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

// @route   GET /api/record-manager/dashboard
// @desc    Get dashboard data for record manager
// @access  Private (Record Manager)
router.get('/dashboard', recordManagerAuth, async (req, res) => {
  try {
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
      status: 'pending' 
    });
    const approvedRequests = await Request.countDocuments({ 
      ...recordManagerRequestFilter,
      status: 'approved' 
    });
    const rejectedRequests = await Request.countDocuments({ 
      ...recordManagerRequestFilter,
      status: 'rejected' 
    });

    res.json({
      totalRequests,
      pendingRequests,
      approvedRequests,
      rejectedRequests
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
