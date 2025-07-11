// components/Navbar.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useSupabase } from '@/hooks/useSupabase';
import toast from 'react-hot-toast';

interface NavbarProps {
  showHome?: boolean;
}

export default function Navbar({ showHome }: NavbarProps) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const supabase = useSupabase();


  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast.success('Logged out successfully!');
      router.push('/auth/login');
    } catch (error: any) {
      toast.error(`Logout failed: ${error.message}`);
    }
  };

  const navLinks = (
    <>
      {user ? (
        <>
          <Link href="/dashboard" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-700">Dashboard</Link>
          <div className="relative group">
            <button className="px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none">Account</button>
            <div className="absolute z-10 hidden group-hover:block bg-white text-black w-40 rounded-md shadow-lg">
              <Link href="/dashboard/bio" className="block px-4 py-2 text-sm hover:bg-gray-100">Profile</Link>
              <Link href="/dashboard/tickets" className="block px-4 py-2 text-sm hover:bg-gray-100">Support Tickets</Link>
              <Link href="/dashboard/Withdraw" className="block px-4 py-2 text-sm hover:bg-gray-100">Withdraw</Link>
            </div>
          </div>
          <Link href="/transfer" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-700">Transfer</Link>
        </>
      ) : (
        <>
          <div className="relative group">
            <button className="px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none">Banking</button>
            <div className="absolute z-10 hidden group-hover:block bg-white text-black w-40 rounded-md shadow-lg">
              <Link href="/banking" className="block px-4 py-2 text-sm hover:bg-gray-100">All Banking</Link>
              <Link href="/banking/checking" className="block px-4 py-2 text-sm hover:bg-gray-100">Checking</Link>
              <Link href="/banking/savings" className="block px-4 py-2 text-sm hover:bg-gray-100">Savings</Link>
              <Link href="/banking/cd" className="block px-4 py-2 text-sm hover:bg-gray-100">CDs</Link>
            </div>
          </div>
          <div className="relative group">
            <button className="px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none">Mortgages</button>
            <div className="absolute z-10 hidden group-hover:block bg-white text-black w-40 rounded-md shadow-lg">
              <Link href="/mortgages" className="block px-4 py-2 text-sm hover:bg-gray-100">All Mortgages</Link>
              <Link href="/mortgages/purchase" className="block px-4 py-2 text-sm hover:bg-gray-100">Purchase</Link>
              <Link href="/mortgages/refinance" className="block px-4 py-2 text-sm hover:bg-gray-100">Refinance</Link>
              <Link href="/mortgages/home-equity" className="block px-4 py-2 text-sm hover:bg-gray-100">Home Equity</Link>
              <Link href="/mortgages/lite-doc" className="block px-4 py-2 text-sm hover:bg-gray-100">Lite Doc</Link>
            </div>
          </div>
          <Link href="/pay-ring" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-700">Pay Ring</Link>
          <Link href="/about" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-700">About</Link>
          <Link href="/contact" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-700">Contact</Link>
        </>
      )}
    </>
  );

  return (
    <nav className="bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-lg">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2 text-2xl font-bold hover:text-blue-200 transition-colors">
              <img src="/logo.png" alt="Asaba Bank Logo" className="h-8 w-auto" />
              <span>Asaba Bank</span>
            </Link>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                {navLinks}
              </div>
            </div>
          </div>
          <div className="hidden md:block">
            <div className="ml-4 flex items-center md:ml-6">
              {authLoading ? (
                <span className="text-gray-300">Loading...</span>
              ) : user ? (
                <button
                  onClick={handleLogout}
                  className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-full transition-colors shadow-md"
                >
                  Logout
                </button>
              ) : (
                <div className="flex items-center space-x-2">
                  <Link href="/auth/login" className="hover:text-blue-200 transition-colors px-3 py-2 rounded-md text-sm font-medium">Login</Link>
                  <Link href="/register" className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-full transition-colors shadow-md">Register</Link>
                </div>
              )}
            </div>
          </div>
          <div className="-mr-2 flex md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="bg-blue-600 inline-flex items-center justify-center p-2 rounded-md text-blue-200 hover:text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-blue-800 focus:ring-white"
            >
              <span className="sr-only">Open main menu</span>
              {isMobileMenuOpen ? (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
      {isMobileMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navLinks}
            <div className="pt-4 pb-3 border-t border-blue-700">
              {authLoading ? (
                <div className="px-3 py-2"><span className="text-gray-300">Loading...</span></div>
              ) : user ? (
                <div className="flex items-center px-5">
                  <button
                    onClick={handleLogout}
                    className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-full transition-colors shadow-md"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <div className="px-2 space-y-2">
                  <Link href="/auth/login" className="block text-center hover:text-blue-200 transition-colors px-3 py-2 rounded-md text-base font-medium">Login</Link>
                  <Link href="/register" className="block text-center bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-full transition-colors shadow-md">Register</Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
