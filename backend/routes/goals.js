const express = require('express');
const router = express.Router();
const Goal = require('../models/goal');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);

// ── GET ALL GOALS ──
router.get('/', async (req, res) => {
  try {
    const goals = await Goal.find({ userId: req.user.id })
      .sort({ createdAt: -1 });
    return res.json({ goals });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch goals' });
  }
});

// ── CREATE GOAL ──
router.post('/', async (req, res) => {
  try {
    const { title, targetAmount, emoji, deadline } = req.body;

    if (!title || !targetAmount) {
      return res.status(400).json({
        message: 'Title and target amount are required'
      });
    }

    if (targetAmount <= 0) {
      return res.status(400).json({
        message: 'Target amount must be greater than 0'
      });
    }

    const goal = await Goal.create({
      userId: req.user.id,
      title,
      targetAmount,
      emoji: emoji || '🎯',
      deadline: deadline || null
    });

    return res.status(201).json({ goal });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to create goal' });
  }
});

// ── ADD MONEY TO GOAL ──
router.patch('/:id/add', async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        message: 'Amount must be greater than 0'
      });
    }

    const goal = await Goal.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }

    goal.savedAmount += parseFloat(amount);

    // Mark completed if target reached
    if (goal.savedAmount >= goal.targetAmount) {
      goal.savedAmount = goal.targetAmount;
      goal.isCompleted = true;
    }

    await goal.save();
    return res.json({ goal });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update goal' });
  }
});

// ── DELETE GOAL ──
router.delete('/:id', async (req, res) => {
  try {
    await Goal.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id
    });
    return res.json({ message: 'Goal deleted' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete goal' });
  }
});

module.exports = router;