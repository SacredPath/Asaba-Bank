'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useSupabase } from '@/hooks/useSupabase';
// import { auditLogger } from '@/lib/audit-logger';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function AdminNavbar() {
  const router = useRouter();
  const { user } = useAuth();
  const supabase = useSupabase();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [adminName, setAdminName] = useState<string>('');
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (user?.id) {
      checkAdminAccess();
    }
  }, [user?.id]);

  const checkAdminAccess = async () => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role, full_name')
        .eq('id', user?.id)
        .single();

      if (error || profile?.role !== 'admin') {
        router.push('/auth/login');
        return;
      }

      setIsAdmin(true);
      setAdminName(profile?.full_name || user?.email?.split('@')[0] || 'Admin');
    } catch (error) {
      console.error('Error checking admin access:', error);
      router.push('/auth/login');
    }
  };

  const loadAdminProfile = async () => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user?.id)
        .single();

      if (error) throw error;
      setAdminName(profile?.full_name || user?.email?.split('@')[0] || 'Admin');
    } catch (error) {
      console.error('Error loading admin profile:', error);
      setAdminName(user?.email?.split('@')[0] || 'Admin');
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      // await auditLogger.logAdminAction(user?.id || '', 'admin_logout');
      await supabase.auth.signOut();
      router.push('/auth/login');
    } catch (error) {
      console.error('Logout error:', error);
      setIsLoggingOut(false);
    }
  };

  // Don't render if not admin
  if (!isAdmin) {
    return null;
  }

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
              {adminName}
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