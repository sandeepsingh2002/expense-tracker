"use client";
import Sidebar from './sidebar';
import { useAuth } from '@/context/AuthContext';
import { usePathname } from 'next/navigation';

// Pages that don't need sidebar
const publicPages = ['/', '/login', '/register'];

export default function AppLayout({ children }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();

  const isPublicPage = publicPages.includes(pathname);

  // Show sidebar only when logged in
  // and not on public pages
  if (isPublicPage || !user || loading) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-gray-950">
      {/* Sidebar */}
      <Sidebar />

      {/* Main content */}
      <main className="flex-1 md:ml-56 pb-20 md:pb-0">
        {children}
      </main>
    </div>
  );
}