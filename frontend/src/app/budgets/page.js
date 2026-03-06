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
  Food: '🍕',
  Rent: '🏠',
  Travel: '🚗',
  Shopping: '🛍️',
  Entertainment: '🎬',
  Health: '🏥',
  Education: '📚',
  Grocery: '🛒',
  Bills: '💡',
  Other: '📦'
};

export default function BudgetsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [budgets, setBudgets] = useState([]);
  const [form, setForm] = useState({ category: '', amount: '' });
  const [error, setError] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (user) fetchBudgets();
  }, [user]);

  const fetchBudgets = async () => {
    try {
      const { data } = await api.get('/budgets');
      setBudgets(data.budgets || []);
    } catch (err) {
      setError('Failed to load budgets');
    } finally {
      setDataLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setFormLoading(true);
    try {
      await api.post('/budgets', {
        category: form.category,
        amount: parseFloat(form.amount)
      });
      setForm({ category: '', amount: '' });
      await fetchBudgets();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to set budget');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/budgets/${id}`);
      await fetchBudgets();
    } catch (err) {
      setError('Failed to delete budget');
    }
  };

  const getStatusColor = (status) => {
    if (status === 'exceeded') return 'text-red-400';
    if (status === 'warning') return 'text-yellow-400';
    return 'text-green-400';
  };

  const getBarColor = (status) => {
    if (status === 'exceeded') return 'bg-red-500';
    if (status === 'warning') return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStatusMessage = (status, category) => {
    if (status === 'exceeded')
      return `🚨 ${category} budget exceeded!`;
    if (status === 'warning')
      return `⚠️ ${category} budget almost full`;
    return null;
  };

  const currentMonth = new Date().toLocaleString('default', {
    month: 'long', year: 'numeric'
  });

  if (loading || dataLoading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <p className="text-white">Loading...</p>
    </div>
  );

  // Get alerts
  const alerts = budgets.filter(b =>
    b.status === 'exceeded' || b.status === 'warning'
  );

  return (
    <main className="min-h-screen bg-gray-950 p-4 md:p-8">
      <div className="max-w-3xl mx-auto flex flex-col gap-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">
              Budget Manager 💰
            </h1>
            <p className="text-gray-400 text-sm">{currentMonth}</p>
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-sm"
          >
            ← Dashboard
          </button>
        </div>

        {/* Alerts */}
        {alerts.length > 0 && (
          <div className="flex flex-col gap-2">
            {alerts.map(b => (
              <div
                key={b._id}
                className={`px-4 py-3 rounded-xl text-sm font-medium border ${
                  b.status === 'exceeded'
                    ? 'bg-red-500/10 border-red-500/20 text-red-400'
                    : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'
                }`}
              >
                {getStatusMessage(b.status, b.category)}
                {b.status === 'exceeded' && (
                  <span className="ml-2 text-xs opacity-70">
                    Over by ₹{(b.spent - b.amount).toLocaleString()}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Set Budget Form */}
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <h2 className="text-white font-bold mb-4">
            Set Monthly Budget
          </h2>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <select
                value={form.category}
                onChange={(e) => setForm(p => ({
                  ...p, category: e.target.value
                }))}
                required
                className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-blue-500"
              >
                <option value="">Select Category</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>
                    {categoryIcons[cat]} {cat}
                  </option>
                ))}
              </select>

              <input
                type="number"
                placeholder="Budget Amount (₹)"
                value={form.amount}
                onChange={(e) => setForm(p => ({
                  ...p, amount: e.target.value
                }))}
                required
                className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm outline-none focus:border-blue-500"
              />
            </div>

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
              {formLoading ? 'Saving...' : '+ Set Budget'}
            </button>
          </form>
        </div>

        {/* Budget List */}
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <h2 className="text-white font-bold mb-4">
            This Month's Budgets ({budgets.length})
          </h2>

          {budgets.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 text-sm">
                No budgets set yet.
              </p>
              <p className="text-gray-600 text-xs mt-1">
                Set a budget above to track spending!
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {budgets.map((b) => (
                <div key={b._id} className="flex flex-col gap-2">
                  {/* Category + amounts */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">
                        {categoryIcons[b.category] || '📦'}
                      </span>
                      <span className="text-white font-medium text-sm">
                        {b.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className={`text-sm font-bold ${getStatusColor(b.status)}`}>
                          ₹{b.spent.toLocaleString()}
                          <span className="text-gray-500 font-normal">
                            {' '}/{' '}₹{b.amount.toLocaleString()}
                          </span>
                        </p>
                        <p className="text-gray-500 text-xs">
                          ₹{b.remaining.toLocaleString()} remaining
                        </p>
                      </div>
                      <button
                        onClick={() => handleDelete(b._id)}
                        className="text-gray-600 hover:text-red-400 text-sm transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-gray-800 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${getBarColor(b.status)}`}
                      style={{
                        width: `${Math.min(100, b.percentage)}%`
                      }}
                    />
                  </div>

                  {/* Percentage */}
                  <div className="flex justify-between">
                    <span className={`text-xs ${getStatusColor(b.status)}`}>
                      {b.percentage}% used
                    </span>
                    {b.status === 'exceeded' && (
                      <span className="text-red-400 text-xs">
                        Over by ₹{(b.spent - b.amount).toLocaleString()}
                      </span>
                    )}
                    {b.status === 'warning' && (
                      <span className="text-yellow-400 text-xs">
                        Almost at limit!
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </main>
  );
}