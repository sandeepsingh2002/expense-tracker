"use client";
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useEffect } from 'react';

export default function LandingPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  // If already logged in → go to dashboard
  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <p className="text-white">Loading...</p>
    </div>
  );

  return (
    <main className="min-h-screen bg-gray-950 flex flex-col">

      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-4 border-b border-gray-800">
        <h1 className="text-xl font-bold text-white">
          💰 SpendSmart
        </h1>
        <div className="flex gap-3">
          <button
            onClick={() => router.push('/login')}
            className="px-4 py-2 text-gray-300 hover:text-white text-sm transition-colors"
          >
            Login
          </button>
          <button
            onClick={() => router.push('/register')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium transition-colors"
          >
            Get Started Free
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-4 text-center py-20">
        <div className="max-w-2xl mx-auto">

          <div className="inline-block px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-xs font-medium mb-6">
            ✨ Free Forever — No Credit Card Required
          </div>

          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Track Every Rupee.
            <span className="text-blue-400"> Stay in Control.</span>
          </h1>

          <p className="text-gray-400 text-lg mb-8 max-w-xl mx-auto">
            SpendSmart helps you track UPI transactions,
            set budgets, save for goals, and understand
            your spending habits — all in one place.
          </p>

          <div className="flex gap-3 justify-center flex-wrap">
            <button
              onClick={() => router.push('/register')}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold transition-colors"
            >
              Start Tracking Free →
            </button>
            <button
              onClick={() => router.push('/login')}
              className="px-8 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-semibold transition-colors"
            >
              Login
            </button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-8 py-16 border-t border-gray-800">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-white text-center mb-10">
            Everything you need to manage money
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { icon: '📊', title: 'Smart Analytics', desc: 'Visual charts for spending patterns' },
              { icon: '🎯', title: 'Budget Alerts', desc: 'Get warned before overspending' },
              { icon: '⭐', title: 'Savings Goals', desc: 'Track progress toward dreams' },
              { icon: '📂', title: 'CSV Import', desc: 'Import bank statements easily' },
              { icon: '🔄', title: 'Recurring', desc: 'Never forget subscriptions' },
              { icon: '🔒', title: 'Secure', desc: 'JWT auth keeps data safe' },
            ].map((feature) => (
              <div
                key={feature.title}
                className="bg-gray-900 border border-gray-800 rounded-2xl p-4"
              >
                <div className="text-3xl mb-2">{feature.icon}</div>
                <h3 className="text-white font-medium text-sm mb-1">
                  {feature.title}
                </h3>
                <p className="text-gray-500 text-xs">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 px-8 py-6 text-center">
        <p className="text-gray-600 text-sm">
          Built with Next.js + Node.js + MongoDB
        </p>
      </footer>

    </main>
  );
}
