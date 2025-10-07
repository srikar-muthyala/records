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

// @route   GET /api/records
// @desc    Get all records (public)
// @access  Public
router.get('/', async (req, res) => {
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

// @route   POST /api/records/import
// @desc    Import records from Excel file
// @access  Private (Admin)
router.post('/import', adminAuth, upload.single('file'), async (req, res) => {
  try {
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

    const records = [];
    const errors = [];

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      
      // Validate required fields
      if (!row.title || !row.category) {
        errors.push(`Row ${i + 2}: Title and category are required`);
        continue;
      }

      try {
        const record = new Record({
          title: row.title,
          description: row.description || '',
          category: row.category,
          metadata: {
            author: row.author || '',
            year: row.year || '',
            isbn: row.isbn || '',
            publisher: row.publisher || ''
          }
        });

        records.push(record);
      } catch (error) {
        errors.push(`Row ${i + 2}: ${error.message}`);
      }
    }

    if (records.length > 0) {
      await Record.insertMany(records);
    }

    res.json({
      message: `Successfully imported ${records.length} records`,
      imported: records.length,
      errors: errors
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
