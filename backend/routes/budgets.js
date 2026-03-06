const express = require('express');
const router = express.Router();
const Budget = require('../models/Budget');
const Transaction = require('../models/Transaction');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);

// ── GET ALL BUDGETS WITH SPENDING ──
router.get('/', async (req, res) => {
  try {
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();

    // Get budgets for this month
    const budgets = await Budget.find({
      userId: req.user.id,
      month,
      year
    });

    // Get this month's transactions
    const transactions = await Transaction.find({
      userId: req.user.id,
      type: 'expense',
      date: {
        $gte: new Date(year, month, 1),
        $lte: new Date(year, month + 1, 0)
      }
    });

    // Calculate spending per category
    const spendingMap = {};
    transactions.forEach(t => {
      spendingMap[t.category] = (spendingMap[t.category] || 0) + t.amount;
    });

    // Combine budgets with spending
    const budgetsWithSpending = budgets.map(b => {
      const spent = spendingMap[b.category] || 0;
      const percentage = ((spent / b.amount) * 100).toFixed(1);
      const status = spent > b.amount
        ? 'exceeded'
        : spent >= b.amount * 0.8
        ? 'warning'
        : 'good';

      return {
        _id: b._id,
        category: b.category,
        amount: b.amount,
        spent,
        remaining: Math.max(0, b.amount - spent),
        percentage: parseFloat(percentage),
        status
      };
    });

    return res.json({ budgets: budgetsWithSpending });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch budgets' });
  }
});

// ── SET / UPDATE BUDGET ──
router.post('/', async (req, res) => {
  try {
    const { category, amount } = req.body;
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();

    if (!category || !amount) {
      return res.status(400).json({
        message: 'Category and amount are required'
      });
    }

    if (amount <= 0) {
      return res.status(400).json({
        message: 'Amount must be greater than 0'
      });
    }

    // Upsert — create if not exists, update if exists
    const budget = await Budget.findOneAndUpdate(
      { userId: req.user.id, category, month, year },
      { amount },
      { upsert: true, new: true }
    );

    return res.status(201).json({ budget });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to set budget' });
  }
});

// ── DELETE BUDGET ──
router.delete('/:id', async (req, res) => {
  try {
    await Budget.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id
    });
    return res.json({ message: 'Budget deleted' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete budget' });
  }
});

module.exports = router;
