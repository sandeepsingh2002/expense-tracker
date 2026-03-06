"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import api from '@/utils/api';

const categories = [
  'Food', 'Rent', 'Travel', 'Shopping',
  'Entertainment', 'Health', 'Education',
  'Grocery', 'Bills', 'Other'
];

const categoryIcons = {
  Food: '🍕', Rent: '🏠', Travel: '🚗',
  Shopping: '🛍️', Entertainment: '🎬',
  Health: '🏥', Education: '📚',
  Grocery: '🛒', Bills: '💡', Other: '📦'
};

export default function RecurringPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [recurring, setRecurring] = useState([]);
  const [form, setForm] = useState({
    title: '',
    amount: '',
    category: '',
    paymentMode: 'upi',
    dayOfMonth: '1'
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [payingId, setPayingId] = useState(null);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (user) fetchRecurring();
  }, [user]);

  const fetchRecurring = async () => {
    try {
      const { data } = await api.get('/recurring');
      setRecurring(data.recurring || []);
    } catch (err) {
      setError('Failed to load recurring expenses');
    } finally {
      setDataLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setFormLoading(true);
    try {
      await api.post('/recurring', {
        ...form,
        amount: parseFloat(form.amount),
        dayOfMonth: parseInt(form.dayOfMonth)
      });
      setForm({
        title: '',
        amount: '',
        category: '',
        paymentMode: 'upi',
        dayOfMonth: '1'
      });
      await fetchRecurring();
    } catch (err) {
      setError(err.response?.data?.message ||
        'Failed to create recurring expense');
    } finally {
      setFormLoading(false);
    }
  };

  const handlePay = async (id) => {
    setPayingId(id);
    setError('');
    setSuccess('');
    try {
      await api.post(`/recurring/${id}/pay`);
      setSuccess('✅ Added to transactions!');
      await fetchRecurring();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to add transaction');
    } finally {
      setPayingId(null);
    }
  };

  const handleToggle = async (id) => {
    try {
      await api.patch(`/recurring/${id}/toggle`);
      await fetchRecurring();
    } catch (err) {
      setError('Failed to toggle');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/recurring/${id}`);
      await fetchRecurring();
    } catch (err) {
      setError('Failed to delete');
    }
  };

  const getStatusBadge = (item) => {
    if (item.isDueToday) return {
      text: '🔴 Due Today!',
      className: 'bg-red-500/10 border-red-500/20 text-red-400'
    };
    if (item.isDueSoon) return {
      text: `🟡 Due in ${item.daysUntilDue} days`,
      className: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'
    };
    return {
      text: `📅 Day ${item.dayOfMonth} of month`,
      className: 'bg-gray-800 border-gray-700 text-gray-400'
    };
  };

  if (loading || dataLoading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <p className="text-white">Loading...</p>
    </div>
  );

  const dueToday = recurring.filter(r => r.isDueToday && r.isActive);
  const dueSoon = recurring.filter(r => r.isDueSoon && r.isActive);

  return (
    <main className="min-h-screen bg-gray-950 p-4 md:p-8">
      <div className="max-w-3xl mx-auto flex flex-col gap-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">
              Recurring Expenses 🔄
            </h1>
            <p className="text-gray-400 text-sm">
              {recurring.length} recurring •{' '}
              {dueToday.length} due today
            </p>
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-sm"
          >
            ← Dashboard
          </button>
        </div>

        {/* Success message */}
        {success && (
          <div className="px-4 py-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
            {success}
          </div>
        )}

        {/* Due today alerts */}
        {dueToday.length > 0 && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4">
            <p className="text-red-400 font-medium text-sm mb-2">
              🔴 Due Today:
            </p>
            <div className="flex flex-col gap-2">
              {dueToday.map(r => (
                <div key={r._id}
                  className="flex items-center justify-between">
                  <span className="text-white text-sm">
                    {categoryIcons[r.category]} {r.title} —
                    ₹{r.amount.toLocaleString()}
                  </span>
                  <button
                    onClick={() => handlePay(r._id)}
                    disabled={payingId === r._id}
                    className="px-3 py-1 bg-red-500 hover:bg-red-400 text-white rounded-lg text-xs font-medium"
                  >
                    {payingId === r._id ? 'Adding...' : 'Mark Paid'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Due soon alerts */}
        {dueSoon.length > 0 && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-4">
            <p className="text-yellow-400 font-medium text-sm mb-1">
              ⚠️ Coming up soon:
            </p>
            {dueSoon.map(r => (
              <p key={r._id} className="text-gray-400 text-xs">
                {r.title} — due in {r.daysUntilDue} days
                (₹{r.amount.toLocaleString()})
              </p>
            ))}
          </div>
        )}

        {/* Create Form */}
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <h2 className="text-white font-bold mb-4">
            Add Recurring Expense
          </h2>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Title (e.g. Netflix)"
                value={form.title}
                onChange={(e) => setForm(p => ({
                  ...p, title: e.target.value
                }))}
                required
                className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm outline-none focus:border-blue-500"
              />
              <input
                type="number"
                placeholder="Amount (₹)"
                value={form.amount}
                onChange={(e) => setForm(p => ({
                  ...p, amount: e.target.value
                }))}
                required
                className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm outline-none focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <select
                value={form.category}
                onChange={(e) => setForm(p => ({
                  ...p, category: e.target.value
                }))}
                required
                className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-blue-500"
              >
                <option value="">Category</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>
                    {categoryIcons[cat]} {cat}
                  </option>
                ))}
              </select>

              <select
                value={form.paymentMode}
                onChange={(e) => setForm(p => ({
                  ...p, paymentMode: e.target.value
                }))}
                className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-blue-500"
              >
                <option value="upi">📱 UPI</option>
                <option value="cash">💵 Cash</option>
                <option value="card">💳 Card</option>
                <option value="netbanking">🏦 Net Banking</option>
                <option value="other">Other</option>
              </select>

              <input
                type="number"
                placeholder="Day (1-31)"
                min="1"
                max="31"
                value={form.dayOfMonth}
                onChange={(e) => setForm(p => ({
                  ...p, dayOfMonth: e.target.value
                }))}
                required
                className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm outline-none focus:border-blue-500"
              />
            </div>

            <p className="text-gray-500 text-xs">
              💡 Day = which day of month this expense occurs
              (e.g. 1 = 1st of every month)
            </p>

            {error && (
              <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={formLoading}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-colors disabled:opacity-50"
            >
              {formLoading ? 'Adding...' : '+ Add Recurring Expense'}
            </button>
          </form>
        </div>

        {/* Recurring List */}
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <h2 className="text-white font-bold mb-4">
            All Recurring Expenses ({recurring.length})
          </h2>

          {recurring.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 text-sm">
                No recurring expenses yet.
              </p>
              <p className="text-gray-600 text-xs mt-1">
                Add rent, subscriptions, EMIs above!
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {recurring.map((item) => {
                const badge = getStatusBadge(item);
                return (
                  <div
                    key={item._id}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${
                      item.isActive
                        ? 'bg-gray-800 border-gray-700'
                        : 'bg-gray-900 border-gray-800 opacity-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">
                        {categoryIcons[item.category] || '📦'}
                      </span>
                      <div>
                        <p className="text-white text-sm font-medium">
                          {item.title}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-red-400 text-xs font-medium">
                            ₹{item.amount.toLocaleString()}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-lg border ${badge.className}`}>
                            {badge.text}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Mark paid button */}
                      <button
                        onClick={() => handlePay(item._id)}
                        disabled={payingId === item._id || !item.isActive}
                        className="px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-40"
                      >
                        {payingId === item._id ? '...' : '✓ Paid'}
                      </button>

                      {/* Toggle active */}
                      <button
                        onClick={() => handleToggle(item._id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          item.isActive
                            ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                            : 'bg-blue-600 hover:bg-blue-500 text-white'
                        }`}
                      >
                        {item.isActive ? 'Pause' : 'Resume'}
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => handleDelete(item._id)}
                        className="text-gray-600 hover:text-red-400 text-sm transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </main>
  );
}