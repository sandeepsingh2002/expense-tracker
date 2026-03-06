"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import api from '@/utils/api';

const emojiOptions = [
  '🎯', '💻', '📱', '🚗', '🏠', '✈️',
  '👗', '📚', '💪', '🎮', '💍', '🌴'
];

export default function GoalsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [goals, setGoals] = useState([]);
  const [form, setForm] = useState({
    title: '',
    targetAmount: '',
    emoji: '🎯',
    deadline: ''
  });
  const [addMoneyForm, setAddMoneyForm] = useState({
    goalId: null,
    amount: ''
  });
  const [error, setError] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (user) fetchGoals();
  }, [user]);

  const fetchGoals = async () => {
    try {
      const { data } = await api.get('/goals');
      setGoals(data.goals || []);
    } catch (err) {
      setError('Failed to load goals');
    } finally {
      setDataLoading(false);
    }
  };

  const handleCreateGoal = async (e) => {
    e.preventDefault();
    setError('');
    setFormLoading(true);
    try {
      await api.post('/goals', {
        title: form.title,
        targetAmount: parseFloat(form.targetAmount),
        emoji: form.emoji,
        deadline: form.deadline || null
      });
      setForm({ title: '', targetAmount: '', emoji: '🎯', deadline: '' });
      await fetchGoals();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create goal');
    } finally {
      setFormLoading(false);
    }
  };

  const handleAddMoney = async (goalId) => {
    if (!addMoneyForm.amount || addMoneyForm.amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    setError('');
    try {
      await api.patch(`/goals/${goalId}/add`, {
        amount: parseFloat(addMoneyForm.amount)
      });
      setAddMoneyForm({ goalId: null, amount: '' });
      await fetchGoals();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add money');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/goals/${id}`);
      await fetchGoals();
    } catch (err) {
      setError('Failed to delete goal');
    }
  };

  // Calculate estimated completion date
  const getEstimatedDate = (goal) => {
    if (goal.isCompleted) return null;
    const remaining = goal.targetAmount - goal.savedAmount;
    if (remaining <= 0) return null;

    // Calculate monthly saving rate
    const createdDate = new Date(goal.createdAt);
    const now = new Date();
    const monthsElapsed = Math.max(1,
      (now - createdDate) / (1000 * 60 * 60 * 24 * 30)
    );
    const monthlyRate = goal.savedAmount / monthsElapsed;

    if (monthlyRate <= 0) return 'Add money to estimate';

    const monthsNeeded = remaining / monthlyRate;
    const completionDate = new Date(
      now.getTime() + monthsNeeded * 30 * 24 * 60 * 60 * 1000
    );

    return `~${Math.ceil(monthsNeeded)} months (${completionDate.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })})`;
  };

  if (loading || dataLoading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <p className="text-white">Loading...</p>
    </div>
  );

  const activeGoals = goals.filter(g => !g.isCompleted);
  const completedGoals = goals.filter(g => g.isCompleted);

  return (
    <main className="min-h-screen bg-gray-950 p-4 md:p-8">
      <div className="max-w-3xl mx-auto flex flex-col gap-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">
              Savings Goals 🎯
            </h1>
            <p className="text-gray-400 text-sm">
              {activeGoals.length} active •{' '}
              {completedGoals.length} completed
            </p>
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-sm"
          >
            ← Dashboard
          </button>
        </div>

        {/* Create Goal Form */}
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <h2 className="text-white font-bold mb-4">
            Create New Goal
          </h2>

          <form onSubmit={handleCreateGoal} className="flex flex-col gap-3">

            {/* Emoji picker */}
            <div className="flex flex-col gap-2">
              <p className="text-gray-400 text-xs">Choose an emoji:</p>
              <div className="flex flex-wrap gap-2">
                {emojiOptions.map(emoji => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setForm(p => ({ ...p, emoji }))}
                    className={`w-10 h-10 rounded-xl text-xl transition-colors ${
                      form.emoji === emoji
                        ? 'bg-blue-600 border-2 border-blue-400'
                        : 'bg-gray-800 hover:bg-gray-700'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Title + Amount */}
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Goal name (e.g. New Laptop)"
                value={form.title}
                onChange={(e) => setForm(p => ({
                  ...p, title: e.target.value
                }))}
                required
                className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm outline-none focus:border-blue-500"
              />
              <input
                type="number"
                placeholder="Target Amount (₹)"
                value={form.targetAmount}
                onChange={(e) => setForm(p => ({
                  ...p, targetAmount: e.target.value
                }))}
                required
                className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm outline-none focus:border-blue-500"
              />
            </div>

            {/* Deadline (optional) */}
            <div className="flex flex-col gap-1">
              <p className="text-gray-400 text-xs">
                Deadline (optional):
              </p>
              <input
                type="date"
                value={form.deadline}
                onChange={(e) => setForm(p => ({
                  ...p, deadline: e.target.value
                }))}
                className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-blue-500"
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
              {formLoading ? 'Creating...' : '+ Create Goal'}
            </button>
          </form>
        </div>

        {/* Active Goals */}
        {activeGoals.length > 0 && (
          <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
            <h2 className="text-white font-bold mb-4">
              Active Goals ({activeGoals.length})
            </h2>
            <div className="flex flex-col gap-5">
              {activeGoals.map((goal) => {
                const percentage = Math.min(
                  100,
                  ((goal.savedAmount / goal.targetAmount) * 100).toFixed(1)
                );
                const estimated = getEstimatedDate(goal);

                return (
                  <div key={goal._id} className="flex flex-col gap-3">

                    {/* Goal header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{goal.emoji}</span>
                        <div>
                          <p className="text-white font-medium">
                            {goal.title}
                          </p>
                          {estimated && (
                            <p className="text-gray-500 text-xs">
                              📅 {estimated}
                            </p>
                          )}
                          {goal.deadline && (
                            <p className="text-gray-500 text-xs">
                              🗓️ Deadline: {new Date(goal.deadline).toLocaleDateString('en-IN')}
                            </p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDelete(goal._id)}
                        className="text-gray-600 hover:text-red-400 text-sm transition-colors"
                      >
                        ✕
                      </button>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full bg-gray-800 rounded-full h-3">
                      <div
                        className="h-3 rounded-full bg-blue-500 transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>

                    {/* Amounts */}
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-xs">
                        ₹{goal.savedAmount.toLocaleString()} saved
                      </span>
                      <span className="text-white text-xs font-medium">
                        {percentage}%
                      </span>
                      <span className="text-gray-400 text-xs">
                        ₹{goal.targetAmount.toLocaleString()} goal
                      </span>
                    </div>

                    {/* Add money */}
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder="Add amount (₹)"
                        value={
                          addMoneyForm.goalId === goal._id
                            ? addMoneyForm.amount
                            : ''
                        }
                        onChange={(e) => setAddMoneyForm({
                          goalId: goal._id,
                          amount: e.target.value
                        })}
                        className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-white placeholder-gray-500 text-sm outline-none focus:border-green-500"
                      />
                      <button
                        onClick={() => handleAddMoney(goal._id)}
                        className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-xl text-sm font-medium transition-colors"
                      >
                        + Add
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Completed Goals */}
        {completedGoals.length > 0 && (
          <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
            <h2 className="text-white font-bold mb-4">
              Completed Goals 🎉 ({completedGoals.length})
            </h2>
            <div className="flex flex-col gap-3">
              {completedGoals.map((goal) => (
                <div
                  key={goal._id}
                  className="flex items-center justify-between px-4 py-3 rounded-xl bg-green-500/10 border border-green-500/20"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{goal.emoji}</span>
                    <div>
                      <p className="text-white font-medium text-sm">
                        {goal.title}
                      </p>
                      <p className="text-green-400 text-xs">
                        ✅ ₹{goal.targetAmount.toLocaleString()} saved!
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(goal._id)}
                    className="text-gray-600 hover:text-red-400 text-sm"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {goals.length === 0 && (
          <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800 text-center">
            <p className="text-4xl mb-3">🎯</p>
            <p className="text-white font-medium mb-1">
              No goals yet
            </p>
            <p className="text-gray-500 text-sm">
              Create your first savings goal above!
            </p>
          </div>
        )}

      </div>
    </main>
  );
}