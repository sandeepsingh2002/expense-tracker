"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import api from '@/utils/api';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line
} from 'recharts';

const COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
  '#8b5cf6', '#06b6d4', '#f97316', '#84cc16',
  '#ec4899', '#6366f1'
];

export default function AnalyticsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({ balance: 0, income: 0, expense: 0 });
  const [dataLoading, setDataLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('month');

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

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
      console.error('Failed to load data');
    } finally {
      setDataLoading(false);
    }
  };

  // Filter transactions by time period
  const getFilteredTransactions = () => {
    const now = new Date();
    return transactions.filter(t => {
      const date = new Date(t.date);
      if (activeFilter === 'week') {
        const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
        return date >= weekAgo;
      }
      if (activeFilter === 'month') {
        return date.getMonth() === now.getMonth() &&
               date.getFullYear() === now.getFullYear();
      }
      if (activeFilter === 'year') {
        return date.getFullYear() === now.getFullYear();
      }
      return true;
    });
  };

  // Pie chart data — spending by category
  const getPieData = () => {
    const filtered = getFilteredTransactions()
      .filter(t => t.type === 'expense');

    const categoryMap = {};
    filtered.forEach(t => {
      categoryMap[t.category] = (categoryMap[t.category] || 0) + t.amount;
    });

    return Object.entries(categoryMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  };

  // Bar chart data — monthly income vs expense
  const getBarData = () => {
    const monthMap = {};
    const months = ['Jan','Feb','Mar','Apr','May','Jun',
                    'Jul','Aug','Sep','Oct','Nov','Dec'];

    transactions.forEach(t => {
      const date = new Date(t.date);
      const key = months[date.getMonth()];
      if (!monthMap[key]) monthMap[key] = { month: key, income: 0, expense: 0 };
      if (t.type === 'income') monthMap[key].income += t.amount;
      else monthMap[key].expense += t.amount;
    });

    return Object.values(monthMap);
  };

  // Line chart data — daily spending this month
  const getLineData = () => {
    const now = new Date();
    const thisMonth = transactions.filter(t => {
      const date = new Date(t.date);
      return date.getMonth() === now.getMonth() &&
             date.getFullYear() === now.getFullYear() &&
             t.type === 'expense';
    });

    const dayMap = {};
    thisMonth.forEach(t => {
      const day = new Date(t.date).getDate();
      dayMap[day] = (dayMap[day] || 0) + t.amount;
    });

    return Object.entries(dayMap)
      .map(([day, amount]) => ({ day: `Day ${day}`, amount }))
      .sort((a, b) => parseInt(a.day) - parseInt(b.day));
  };

  // Category breakdown table
  const getCategoryBreakdown = () => {
    const filtered = getFilteredTransactions()
      .filter(t => t.type === 'expense');

    const totalExpense = filtered.reduce((sum, t) => sum + t.amount, 0);
    const categoryMap = {};

    filtered.forEach(t => {
      categoryMap[t.category] = (categoryMap[t.category] || 0) + t.amount;
    });

    return Object.entries(categoryMap)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: totalExpense > 0
          ? ((amount / totalExpense) * 100).toFixed(1)
          : 0
      }))
      .sort((a, b) => b.amount - a.amount);
  };

  if (loading || dataLoading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <p className="text-white">Loading...</p>
    </div>
  );

  const pieData = getPieData();
  const barData = getBarData();
  const lineData = getLineData();
  const breakdown = getCategoryBreakdown();

  return (
    <main className="min-h-screen bg-gray-950 p-4 md:p-8">
      <div className="max-w-4xl mx-auto flex flex-col gap-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Analytics 📊</h1>
            <p className="text-gray-400 text-sm">Your spending insights</p>
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-sm"
          >
            ← Dashboard
          </button>
        </div>

        {/* Summary Cards */}
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
            <p className="text-gray-400 text-xs mb-1">Total Income</p>
            <p className="text-xl font-bold text-green-400">
              ₹{summary.income.toLocaleString()}
            </p>
          </div>
          <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
            <p className="text-gray-400 text-xs mb-1">Total Expenses</p>
            <p className="text-xl font-bold text-red-400">
              ₹{summary.expense.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Time Filter */}
        <div className="flex gap-2">
          {['week', 'month', 'year', 'all'].map(filter => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-colors ${
                activeFilter === filter
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Pie Chart */}
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <h2 className="text-white font-bold mb-4">
            Spending by Category
          </h2>
          {pieData.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">
              No expense data for this period
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {pieData.map((entry, index) => (
                    <Cell
                      key={entry.name}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [`₹${value.toLocaleString()}`, 'Amount']}
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '12px',
                    color: '#fff'
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Bar Chart */}
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <h2 className="text-white font-bold mb-4">
            Monthly Income vs Expenses
          </h2>
          {barData.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">
              No data available
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="month" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip
                  formatter={(value) => [`₹${value.toLocaleString()}`]}
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '12px',
                    color: '#fff'
                  }}
                />
                <Legend />
                <Bar dataKey="income" fill="#10b981" radius={[4,4,0,0]} name="Income" />
                <Bar dataKey="expense" fill="#ef4444" radius={[4,4,0,0]} name="Expense" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Line Chart */}
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <h2 className="text-white font-bold mb-4">
            Daily Spending This Month
          </h2>
          {lineData.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">
              No expense data this month
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={lineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="day" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip
                  formatter={(value) => [`₹${value.toLocaleString()}`, 'Spent']}
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '12px',
                    color: '#fff'
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6' }}
                  name="Daily Spending"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Category Breakdown Table */}
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <h2 className="text-white font-bold mb-4">
            Category Breakdown
          </h2>
          {breakdown.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">
              No expense data for this period
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {breakdown.map((item, index) => (
                <div key={item.category}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-white text-sm">{item.category}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-gray-400 text-xs">
                        {item.percentage}%
                      </span>
                      <span className="text-red-400 text-sm font-medium">
                        ₹{item.amount.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full bg-gray-800 rounded-full h-1.5">
                    <div
                      className="h-1.5 rounded-full"
                      style={{
                        width: `${item.percentage}%`,
                        backgroundColor: COLORS[index % COLORS.length]
                      }}
                    />
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