'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './context/AuthContext';

export default function Home() {
  const router = useRouter();
  const { user, loading, isAdmin } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // Not logged in → go to login
        router.push('/login');
      } else if (isAdmin) {
        // Admin → go to admin dashboard
        router.push('/admin');
      } else {
        // Regular user → go to their tickets
        router.push('/dashboard');
      }
    }
  }, [user, loading, isAdmin, router]);

  // Show loading while checking auth and redirecting
  return (
    <div className="min-h-screen bg-slate-950 bg-grid-pattern bg-radial-gradient flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center shadow-lg mb-6">
          <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">KPI Tracker</h1>
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mt-4" />
        <p className="text-slate-400 mt-4">Redirecting...</p>
        </div>
    </div>
  );
}
