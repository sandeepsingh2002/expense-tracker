const express = require('express');
const router = express.Router();
const Recurring = require('../models/recurring');
const Transaction = require('../models/Transaction');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);

// ── GET ALL RECURRING ──
router.get('/', async (req, res) => {
  try {
    const recurring = await Recurring.find({
      userId: req.user.id
    }).sort({ dayOfMonth: 1 });

    // Add "due today" and "due soon" flags
    const today = new Date().getDate();
    const recurringWithStatus = recurring.map(r => {
      const daysUntilDue = r.dayOfMonth >= today
        ? r.dayOfMonth - today
        : 30 - today + r.dayOfMonth;

      return {
        ...r.toObject(),
        daysUntilDue,
        isDueToday: r.dayOfMonth === today,
        isDueSoon: daysUntilDue <= 3 && daysUntilDue > 0
      };
    });

    return res.json({ recurring: recurringWithStatus });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to fetch recurring expenses'
    });
  }
});

// ── CREATE RECURRING ──
router.post('/', async (req, res) => {
  try {
    const {
      title, amount, category,
      paymentMode, dayOfMonth
    } = req.body;

    if (!title || !amount || !category || !dayOfMonth) {
      return res.status(400).json({
        message: 'All fields are required'
      });
    }

    if (dayOfMonth < 1 || dayOfMonth > 31) {
      return res.status(400).json({
        message: 'Day must be between 1 and 31'
      });
    }

    const recurring = await Recurring.create({
      userId: req.user.id,
      title,
      amount,
      category,
      paymentMode: paymentMode || 'upi',
      dayOfMonth
    });

    return res.status(201).json({ recurring });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to create recurring expense'
    });
  }
});

// ── ADD RECURRING TO TRANSACTIONS (mark as paid) ──
router.post('/:id/pay', async (req, res) => {
  try {
    const recurring = await Recurring.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!recurring) {
      return res.status(404).json({
        message: 'Recurring expense not found'
      });
    }

    // Add to transactions
    const transaction = await Transaction.create({
      userId: req.user.id,
      type: 'expense',
      amount: recurring.amount,
      category: recurring.category,
      description: recurring.title,
      paymentMode: recurring.paymentMode,
      date: new Date()
    });

    // Update lastAdded
    recurring.lastAdded = new Date();
    await recurring.save();

    return res.status(201).json({ transaction });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to add recurring expense'
    });
  }
});

// ── TOGGLE ACTIVE ──
router.patch('/:id/toggle', async (req, res) => {
  try {
    const recurring = await Recurring.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!recurring) {
      return res.status(404).json({
        message: 'Recurring expense not found'
      });
    }

    recurring.isActive = !recurring.isActive;
    await recurring.save();

    return res.json({ recurring });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to toggle recurring expense'
    });
  }
});

// ── DELETE RECURRING ──
router.delete('/:id', async (req, res) => {
  try {
    await Recurring.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id
    });
    return res.json({ message: 'Recurring expense deleted' });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to delete recurring expense'
    });
  }
});

module.exports = router;
