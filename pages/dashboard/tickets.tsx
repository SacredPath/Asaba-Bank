import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSupabase } from '@/hooks/useSupabase';
import DashboardNavbar from '@/components/dashboard/Navbar';
import Tickets from '@/components/dashboard/Tickets';

export default function TicketsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      setLoading(false);
    }
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600">Please log in to access tickets.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <DashboardNavbar showHome />
      <main className="max-w-4xl mx-auto mt-8 p-6">
        <Tickets user={user} />
      </main>
    </>
  );
} 