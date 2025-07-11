'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useSupabase } from '@/hooks/useSupabase';
import { auditLogger } from '@/lib/audit-logger';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function AdminNavbar() {
  const router = useRouter();
  const { user } = useAuth();
  const supabase = useSupabase();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await auditLogger.logAdminAction(user?.id || '', 'admin_logout');
      await supabase.auth.signOut();
      router.push('/auth/login');
    } catch (error) {
      console.error('Logout error:', error);
      setIsLoggingOut(false);
    }
  };

  return (
    <nav className="bg-indigo-800 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link href="/admin/dashboard" className="text-xl font-bold">
              AsabaBank Admin
            </Link>
            <div className="hidden md:flex space-x-4">
              <Link 
                href="/admin/dashboard"
                className="px-3 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 transition"
              >
                Dashboard
              </Link>
              <Link 
                href="/admin/users"
                className="px-3 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 transition"
              >
                Users
              </Link>
              <Link 
                href="/dashboard"
                className="px-3 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 transition"
              >
                User Dashboard
              </Link>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <span className="text-sm">
              Admin: {user?.email}
            </span>
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 transition disabled:opacity-50"
            >
              {isLoggingOut ? 'Logging out...' : 'Logout'}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
} 