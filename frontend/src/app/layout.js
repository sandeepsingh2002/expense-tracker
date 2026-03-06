import { Outfit } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import AppLayout from '@/components/AppLayout';

const outfit = Outfit({ subsets: ['latin'] });

export const metadata = {
  title: 'SpendSmart — Expense Tracker',
  description: 'Track your expenses smartly',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={outfit.className}>
        <AuthProvider>
          <AppLayout>
            {children}
          </AppLayout>
        </AuthProvider>
      </body>
    </html>
  );
}