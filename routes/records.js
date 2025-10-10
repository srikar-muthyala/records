const express = require('express');
const multer = require('multer');
const xlsx = require('xlsx');
const { body, validationResult } = require('express-validator');
const Record = require('../models/Record');
const { adminAuth } = require('../middleware/auth');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Test endpoint to check if routes are working
router.get('/test', (req, res) => {
  res.json({ message: 'Records route is working' });
});

// Debug endpoint to check record fields
router.get('/debug-fields', async (req, res) => {
  try {
    const record = await Record.findOne({});
    const totalCount = await Record.countDocuments();
    
    if (record) {
      res.json({
        message: 'Sample record found',
        totalRecords: totalCount,
        fields: Object.keys(record.toObject()),
        sampleData: {
          title: record.title,
          name: record.name,
          branchCode: record.branchCode,
          fileId: record.fileId,
          employeeId: record.employeeId,
          ppoUniqueId: record.ppoUniqueId,
          pensionStatus: record.pensionStatus,
          mobileNumber: record.mobileNumber,
          category: record.category
        }
      });
    } else {
      res.json({ message: 'No records found in database', totalRecords: totalCount });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// @route   GET /api/records
// @desc    Get all records (public)
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', category = '', status = '' } = req.query;
    
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
    if (status) {
      query.status = status;
    } else {
      // Add status filter to reduce scanned documents
      if (!query.status) {
        query.status = { $in: ['available', 'borrowed'] };
      }
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

// @route   GET /api/records/categories
// @desc    Get all categories
// @access  Public
router.get('/categories', async (req, res) => {
  try {
    const categories = await Record.distinct('category');
    res.json(categories);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/records/:id
// @desc    Get single record
// @access  Public
router.get('/:id', async (req, res) => {
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

// @route   POST /api/records
// @desc    Create a new record
// @access  Private (Admin)
router.post('/', adminAuth, [
  body('title').notEmpty().withMessage('Title is required'),
  body('category').notEmpty().withMessage('Category is required'),
  body('description').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, category, metadata } = req.body;

    const record = new Record({
      title,
      description,
      category,
      metadata: metadata || {}
    });

    await record.save();

    res.status(201).json(record);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/records/:id
// @desc    Update record
// @access  Private (Admin)
router.put('/:id', adminAuth, [
  body('title').optional().notEmpty().withMessage('Title cannot be empty'),
  body('category').optional().notEmpty().withMessage('Category cannot be empty')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, category, metadata } = req.body;
    const updateData = {};

    if (title) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (category) updateData.category = category;
    if (metadata) updateData.metadata = metadata;

    const record = await Record.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!record) {
      return res.status(404).json({ message: 'Record not found' });
    }

    res.json(record);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/records/:id
// @desc    Delete record
// @access  Private (Admin)
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const record = await Record.findByIdAndDelete(req.params.id);
    if (!record) {
      return res.status(404).json({ message: 'Record not found' });
    }

    res.json({ message: 'Record deleted successfully' });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/records/debug-mobile
// @desc    Debug mobile number field
// @access  Public
router.get('/debug-mobile', async (req, res) => {
  try {
    const totalRecords = await Record.countDocuments();
    const recordsWithMobile = await Record.find({ 
      mobileNumber: { $exists: true, $ne: '', $ne: null } 
    }).limit(10);
    
    const sampleRecord = await Record.findOne();
    
    res.json({
      totalRecords,
      recordsWithMobileCount: recordsWithMobile.length,
      sampleRecord: sampleRecord ? {
        _id: sampleRecord._id,
        mobileNumber: sampleRecord.mobileNumber,
        name: sampleRecord.name,
        metadata: sampleRecord.metadata
      } : null,
      mobileRecords: recordsWithMobile.map(r => ({
        _id: r._id,
        mobileNumber: r.mobileNumber,
        name: r.name,
        metadata: r.metadata
      }))
    });
  } catch (error) {
    console.error('Mobile debug error:', error);
    res.status(500).json({ message: 'Mobile debug error', error: error.message });
  }
});

// @route   POST /api/records/import
// @desc    Import records from Excel file
// @access  Private (Admin)
router.post('/import', adminAuth, upload.single('file'), async (req, res) => {
  try {
    console.log('Import route hit');
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);

    if (data.length === 0) {
      return res.status(400).json({ message: 'Excel file is empty' });
    }

    console.log('Excel data parsed:', data.slice(0, 2)); // Log first 2 rows for debugging
    
    // Log available columns
    if (data.length > 0) {
    console.log('Available columns:', Object.keys(data[0]));
    console.log('Sample row data:', data[0]);
    
    // Debug mobile number columns specifically
    const sampleRow = data[0];
    console.log('Mobile number debug:');
    console.log('  "m":', sampleRow.m);
    console.log('  "mobile":', sampleRow.mobile);
    console.log('  "Mobile":', sampleRow.Mobile);
    console.log('  "MOBILE":', sampleRow.MOBILE);
    console.log('  "mobileNumber":', sampleRow.mobileNumber);
    console.log('  "Mobile Number":', sampleRow['Mobile Number']);
    console.log('  "MOBILE_NUMBER":', sampleRow.MOBILE_NUMBER);
      
      // Check for branch code variations
      console.log('Branch code variations:');
      console.log('  "Branch_code":', sampleRow['Branch_code']);
      console.log('  "Branch code":', sampleRow['Branch code']);
      console.log('  "Branch Code":', sampleRow['Branch Code']);
      console.log('  "BRANCH_CODE":', sampleRow['BRANCH_CODE']);
      console.log('  "branch_code":', sampleRow.branch_code);
      console.log('  "branchCode":', sampleRow.branchCode);
      
      console.log('File ID variations:');
      console.log('  "file id":', sampleRow['file id']);
      console.log('  "File ID":', sampleRow['File ID']);
      console.log('  "FILE_ID":', sampleRow['FILE_ID']);
      console.log('  "file_id":', sampleRow.file_id);
      console.log('  "fileId":', sampleRow.fileId);
    }

    const records = [];
    const errors = [];

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      
      // Validate required fields - use NAME as title and GROUP_ID as category
      if (!row.NAME && !row.name) {
        errors.push(`Row ${i + 2}: NAME or name field is required`);
        continue;
      }
      if (!row.GROUP_ID && !row.group_id) {
        errors.push(`Row ${i + 2}: GROUP_ID or group_id field is required`);
        continue;
      }

      try {
        const recordData = {
          title: row.NAME || row.name,
          description: `Employee Record - PPO ID: ${row.PPO_UNIQUE_ID || row.ppo_unique_id || 'N/A'}`,
          category: row.GROUP_ID || row.group_id,
          // Pension/Employee specific fields
          branchCode: row['Branch_code'] || row['Branch code'] || row['Branch Code'] || row['BRANCH_CODE'] || row.branch_code || row.branchCode || '',
          fileId: row['file id'] || row['File ID'] || row['FILE_ID'] || row.file_id || row.fileId || '',
          employeeId: row.a || row.employee_id || '',
          name: row.NAME || row.name,
          ppoUniqueId: row.PPO_UNIQUE_ID || row.ppo_unique_id || '',
          pensionStatus: row.PENSION_STATUS || row.pension_status || '',
          groupId: row.GROUP_ID || row.group_id,
          mobileNumber: row.m || row.mobile || row.Mobile || row.MOBILE || row.mobileNumber || row['Mobile Number'] || row.MOBILE_NUMBER || '',
          metadata: {
            // Keep original Excel data for reference
            originalData: {
              branchCode: row['Branch_code'] || row['Branch code'] || row['Branch Code'] || row['BRANCH_CODE'] || row.branch_code || row.branchCode,
              fileId: row['file id'] || row['File ID'] || row['FILE_ID'] || row.file_id || row.fileId,
              employeeId: row.a || row.employee_id,
              ppoUniqueId: row.PPO_UNIQUE_ID || row.ppo_unique_id,
              pensionStatus: row.PENSION_STATUS || row.pension_status,
              mobileNumber: row.m || row.mobile || row.Mobile || row.MOBILE || row.mobileNumber || row['Mobile Number'] || row.MOBILE_NUMBER
            }
          }
        };

        console.log(`Creating record for row ${i + 2}:`, recordData);
        console.log(`Branch code value: "${recordData.branchCode}"`);
        console.log(`File ID value: "${recordData.fileId}"`);
        const record = new Record(recordData);
        
        // Validate the record before adding to array
        const validationError = record.validateSync();
        if (validationError) {
          throw new Error(`Validation error: ${validationError.message}`);
        }
        
        records.push(record);
      } catch (error) {
        console.error(`Error creating record for row ${i + 2}:`, error);
        errors.push(`Row ${i + 2}: ${error.message}`);
      }
    }

    if (records.length > 0) {
      // Clear all existing records before importing new ones
      console.log('Clearing all existing records...');
      await Record.deleteMany({});
      console.log('All existing records cleared');
      
      // Insert new records
      await Record.insertMany(records);
      console.log(`Successfully imported ${records.length} new records`);
    }

    console.log(`Total rows in Excel: ${data.length}`);
    console.log(`Records imported: ${records.length}`);
    console.log(`Records skipped: ${data.length - records.length}`);
    console.log(`Errors encountered: ${errors.length}`);
    
    if (errors.length > 0) {
      console.log('First 10 errors:', errors.slice(0, 10));
    }

    res.json({
      message: `Successfully replaced all records with ${records.length} new records`,
      imported: records.length,
      totalRows: data.length,
      skipped: data.length - records.length,
      errors: errors
    });
  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
