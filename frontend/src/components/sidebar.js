"use client";
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

const navItems = [
  { label: 'Dashboard',  href: '/dashboard',  icon: '🏠' },
  { label: 'Analytics',  href: '/analytics',  icon: '📊' },
  { label: 'Budgets',    href: '/budgets',    icon: '🎯' },
  { label: 'Goals',      href: '/goals',      icon: '⭐' },
  { label: 'Recurring',  href: '/recurring',  icon: '🔄' },
  { label: 'Import CSV', href: '/import',     icon: '📂' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <>
      {/* ── DESKTOP SIDEBAR ── */}
      <aside className="hidden md:flex flex-col w-56 min-h-screen bg-gray-900 border-r border-gray-800 p-4 fixed left-0 top-0">

        {/* Logo */}
        <div className="mb-8 px-2">
          <h1 className="text-xl font-bold text-white">
            💰 SpendSmart
          </h1>
          <p className="text-gray-500 text-xs mt-1 truncate">
            {user?.name}
          </p>
        </div>

        {/* Nav Links */}
        <nav className="flex flex-col gap-1 flex-1">
          {navItems.map((item) => (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left ${
                pathname === item.href
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        {/* User + Logout */}
        <div className="border-t border-gray-800 pt-4 mt-4">
          <div className="px-3 py-2 mb-2">
            <p className="text-white text-sm font-medium truncate">
              {user?.name}
            </p>
            <p className="text-gray-500 text-xs truncate">
              {user?.email}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-colors"
          >
            <span>🚪</span>
            Logout
          </button>
        </div>
      </aside>

      {/* ── MOBILE BOTTOM NAV ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 flex justify-around items-center px-2 py-2 z-50">
        {navItems.slice(0, 5).map((item) => (
          <button
            key={item.href}
            onClick={() => router.push(item.href)}
            className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition-colors ${
              pathname === item.href
                ? 'text-blue-400'
                : 'text-gray-500 hover:text-white'
            }`}
          >
            <span className="text-xl">{item.icon}</span>
            <span className="text-xs">{item.label.split(' ')[0]}</span>
          </button>
        ))}
      </nav>
    </>
  );
}