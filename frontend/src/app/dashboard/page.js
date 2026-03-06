"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import api from '@/utils/api';

// Category options
const expenseCategories = [
  'Food', 'Rent', 'Travel', 'Shopping',
  'Entertainment', 'Health', 'Education',
  'Grocery', 'Bills', 'Other'
];

const incomeCategories = [
  'Salary', 'Freelance', 'Business',
  'Investment', 'Gift', 'Other'
];

// Auto detect category from description
const autoDetectCategory = (description) => {
  const text = description.toLowerCase();
  if (['swiggy', 'zomato', 'dominos', 'pizza', 'food',
       'restaurant', 'cafe', 'tea', 'chai'].some(k => text.includes(k)))
    return 'Food';
  if (['uber', 'ola', 'rapido', 'petrol', 'diesel',
       'metro', 'bus', 'auto'].some(k => text.includes(k)))
    return 'Travel';
  if (['amazon', 'flipkart', 'myntra', 'meesho',
       'shopping'].some(k => text.includes(k)))
    return 'Shopping';
  if (['netflix', 'spotify', 'prime', 'hotstar',
       'movie'].some(k => text.includes(k)))
    return 'Entertainment';
  if (['blinkit', 'zepto', 'bigbasket',
       'grocery'].some(k => text.includes(k)))
    return 'Grocery';
  if (['rent', 'house', 'pg',
       'hostel'].some(k => text.includes(k)))
    return 'Rent';
  if (['hospital', 'medicine', 'doctor',
       'health'].some(k => text.includes(k)))
    return 'Health';
  return '';
};

export default function Dashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({
    balance: 0, income: 0, expense: 0
  });
  const [form, setForm] = useState({
    type: 'expense',
    amount: '',
    category: '',
    description: '',
    paymentMode: 'upi',
    date: new Date().toISOString().split('T')[0]
  });
  const [error, setError] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);

  // Auth guard
  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  // Fetch data when user loads
  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      const [transRes, sumRes] = await Promise.all([
        api.get('/transactions'),
        api.get('/transactions/summary')
      ]);
      setTransactions(transRes.data.transactions || []);
      setSummary(sumRes.data);
    } catch (err) {
      setError('Failed to load data');
    } finally {
      setDataLoading(false);
    }
  };

  const handleDescriptionChange = (e) => {
    const desc = e.target.value;
    setForm(prev => ({
      ...prev,
      description: desc,
      category: autoDetectCategory(desc) || prev.category
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setFormLoading(true);
    try {
      await api.post('/transactions', {
        ...form,
        amount: parseFloat(form.amount)
      });
      setForm({
        type: 'expense',
        amount: '',
        category: '',
        description: '',
        paymentMode: 'upi',
        date: new Date().toISOString().split('T')[0]
      });
      await fetchData();
    } catch (err) {
      setError(err.response?.data?.message ||
        'Failed to add transaction');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/transactions/${id}`);
      await fetchData();
    } catch (err) {
      setError('Failed to delete transaction');
    }
  };

  if (loading || dataLoading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <p className="text-white text-lg">Loading...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 p-4 md:p-8">
      <div className="max-w-4xl mx-auto flex flex-col gap-6">

        {/* ── TOP BAR ── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">
              Dashboard 🏠
            </h1>
            <p className="text-gray-400 text-sm">
              Welcome back, {user?.name}! 👋
            </p>
          </div>
          <div className="text-gray-400 text-sm hidden md:block">
            {new Date().toLocaleDateString('en-IN', {
              weekday: 'long',
              day: 'numeric',
              month: 'long'
            })}
          </div>
        </div>

        {/* ── SUMMARY CARDS ── */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
            <p className="text-gray-400 text-xs mb-1">Balance</p>
            <p className={`text-xl font-bold ${
              summary.balance >= 0 ? 'text-white' : 'text-red-400'
            }`}>
              ₹{summary.balance.toLocaleString()}
            </p>
          </div>
          <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
            <p className="text-gray-400 text-xs mb-1">Income</p>
            <p className="text-xl font-bold text-green-400">
              ₹{summary.income.toLocaleString()}
            </p>
          </div>
          <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
            <p className="text-gray-400 text-xs mb-1">Expenses</p>
            <p className="text-xl font-bold text-red-400">
              ₹{summary.expense.toLocaleString()}
            </p>
          </div>
        </div>

        {/* ── ADD TRANSACTION FORM ── */}
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <h2 className="text-white font-bold mb-4">
            Add Transaction
          </h2>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">

            {/* Income / Expense Toggle */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setForm(p => ({
                  ...p, type: 'expense', category: ''
                }))}
                className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
                  form.type === 'expense'
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                💸 Expense
              </button>
              <button
                type="button"
                onClick={() => setForm(p => ({
                  ...p, type: 'income', category: ''
                }))}
                className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
                  form.type === 'income'
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                💰 Income
              </button>
            </div>

            {/* Amount + Category */}
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                placeholder="Amount (₹)"
                value={form.amount}
                onChange={(e) => setForm(p => ({
                  ...p, amount: e.target.value
                }))}
                required
                className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm outline-none focus:border-blue-500 transition-colors"
              />
              <select
                value={form.category}
                onChange={(e) => setForm(p => ({
                  ...p, category: e.target.value
                }))}
                required
                className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-blue-500 transition-colors"
              >
                <option value="">Select Category</option>
                {form.type === 'expense'
                  ? expenseCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))
                  : incomeCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))
                }
              </select>
            </div>

            {/* Description + Payment Mode */}
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Description (e.g. Swiggy)"
                value={form.description}
                onChange={handleDescriptionChange}
                className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm outline-none focus:border-blue-500 transition-colors"
              />
              <select
                value={form.paymentMode}
                onChange={(e) => setForm(p => ({
                  ...p, paymentMode: e.target.value
                }))}
                className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-blue-500 transition-colors"
              >
                <option value="upi">📱 UPI</option>
                <option value="cash">💵 Cash</option>
                <option value="card">💳 Card</option>
                <option value="netbanking">🏦 Net Banking</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Date */}
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm(p => ({
                ...p, date: e.target.value
              }))}
              className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-blue-500 transition-colors"
            />

            {/* Error */}
            {error && (
              <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={formLoading}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {formLoading ? 'Adding...' : '+ Add Transaction'}
            </button>
          </form>
        </div>

        {/* ── TRANSACTIONS LIST ── */}
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <h2 className="text-white font-bold mb-4">
            Recent Transactions ({transactions.length})
          </h2>

          {transactions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-5xl mb-3">💸</p>
              <p className="text-gray-500 text-sm">
                No transactions yet.
              </p>
              <p className="text-gray-600 text-xs mt-1">
                Add your first one above or import CSV!
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {transactions.map((t) => (
                <div
                  key={t._id}
                  className="flex items-center justify-between px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 hover:border-gray-600 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      t.type === 'income'
                        ? 'bg-green-400'
                        : 'bg-red-400'
                    }`} />
                    <div>
                      <p className="text-white text-sm font-medium">
                        {t.description || t.category}
                      </p>
                      <p className="text-gray-500 text-xs">
                        {t.category} • {t.paymentMode} •{' '}
                        {new Date(t.date).toLocaleDateString('en-IN')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`font-bold text-sm ${
                      t.type === 'income'
                        ? 'text-green-400'
                        : 'text-red-400'
                    }`}>
                      {t.type === 'income' ? '+' : '-'}
                      ₹{t.amount.toLocaleString()}
                    </span>
                    <button
                      onClick={() => handleDelete(t._id)}
                      className="text-gray-600 hover:text-red-400 text-sm transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}