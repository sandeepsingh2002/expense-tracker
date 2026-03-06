const express = require('express');
const router = express.Router();
const multer = require('multer');
const Transaction = require('../models/Transaction');
const authMiddleware = require('../middlewares/authMiddleware');
const { parseCSV } = require('../utils/csvParser');

// Setup multer (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' ||
        file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  }
});

// ── PREVIEW CSV ──
router.post('/preview', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const result = parseCSV(req.file.buffer);

    if (!result.success) {
      return res.status(400).json({
        message: 'Failed to parse CSV',
        error: result.error
      });
    }

    return res.json({
      transactions: result.transactions,
      count: result.transactions.length
    });

  } catch (error) {
    return res.status(500).json({
      message: 'Failed to process file',
      error: error.message
    });
  }
});

// ── IMPORT CSV (bulk save) ──
router.post('/import', authMiddleware, async (req, res) => {
  try {
    const { transactions } = req.body;

    if (!transactions || transactions.length === 0) {
      return res.status(400).json({ message: 'No transactions to import' });
    }

    // Add userId to each transaction
    const toInsert = transactions.map(t => ({
      ...t,
      userId: req.user.id
    }));

    await Transaction.insertMany(toInsert);

    return res.status(201).json({
      message: `Successfully imported ${toInsert.length} transactions`,
      count: toInsert.length
    });

  } catch (error) {
    return res.status(500).json({
      message: 'Failed to import transactions',
      error: error.message
    });
  }
});

module.exports = router;
