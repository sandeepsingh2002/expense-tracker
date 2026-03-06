const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const authMiddleware = require('../middlewares/authMiddleware');

// All routes protected by authMiddleware
router.use(authMiddleware);

// ── GET ALL TRANSACTIONS ──
router.get('/', async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.user.id })
      .sort({ date: -1 });
    return res.json({ transactions });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch transactions' });
  }
});

// ── ADD TRANSACTION ──
router.post('/', async (req, res) => {
  try {
    const { type, amount, category, description, paymentMode, date } = req.body;

    if (!type || !amount || !category) {
      return res.status(400).json({ message: 'Type, amount and category are required' });
    }

    if (amount <= 0) {
      return res.status(400).json({ message: 'Amount must be greater than 0' });
    }

    const transaction = await Transaction.create({
      userId: req.user.id,
      type,
      amount,
      category,
      description,
      paymentMode,
      date: date || Date.now()
    });

    return res.status(201).json({ transaction });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to add transaction' });
  }
});

// ── DELETE TRANSACTION ──
router.delete('/:id', async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    await Transaction.findByIdAndDelete(req.params.id);
    return res.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete transaction' });
  }
});

// ── GET SUMMARY (balance, income, expense) ──
router.get('/summary', async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.user.id });

    const income = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const expense = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const balance = income - expense;

    return res.json({ balance, income, expense });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch summary' });
  }
});

module.exports = router;