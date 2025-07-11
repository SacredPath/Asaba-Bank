// components/Footer.tsx
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function Footer() {
  const router = useRouter();
  const { user, loading } = useAuth();

  return (
    <footer className="bg-gray-900 text-white py-4 mt-8 border-t border-gray-700">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center text-sm">
          {/* Bank Info */}
          <div className="flex items-center space-x-4 mb-2 md:mb-0">
            <span className="font-semibold text-blue-400">Asaba Bank</span>
            <span className="text-gray-400">|</span>
            <span className="text-gray-400">NMLS #1234567</span>
            <span className="text-gray-400">|</span>
            <span className="text-gray-400">Routing #123456789</span>
          </div>

          {/* Quick Links */}
          <div className="flex items-center space-x-4">
            {!user && !loading && (
              <>
                <Link href="/auth/login" className="text-gray-400 hover:text-blue-300 transition-colors">
                  Login
                </Link>
                <span className="text-gray-600">|</span>
                <Link href="/register" className="text-gray-400 hover:text-blue-300 transition-colors">
                  Set Up Access
                </Link>
              </>
            )}
            {user && (
              <Link href="/dashboard" className="text-gray-400 hover:text-blue-300 transition-colors">
                Dashboard
              </Link>
            )}
          </div>
        </div>

        {/* Copyright */}
        <div className="text-center mt-3 pt-3 border-t border-gray-800">
          <p className="text-xs text-gray-500">
            &copy; {new Date().getFullYear()} Asaba Bank. All rights reserved. | 
            <span className="ml-1">FDIC Insured</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
