'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSupabase } from '@/hooks/useSupabase';
import { TwoFactorAuth } from '@/lib/twoFactorAuth';
import TwoFactorSetup from '@/components/TwoFactorSetup';
import toast from 'react-hot-toast';

export default function TwoFactorManagement() {
  const { user } = useAuth();
  const supabase = useSupabase();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showSetup, setShowSetup] = useState(false);
  const [showDisable, setShowDisable] = useState(false);
  const [disableCode, setDisableCode] = useState('');
  const [disabling, setDisabling] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadProfile();
    }
  }, [user?.id]);

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error loading profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleEnable2FA = () => {
    setShowSetup(true);
  };

  const handleSetupComplete = async () => {
    setShowSetup(false);
    await loadProfile(); // Refresh profile data
    toast.success('Two-factor authentication enabled successfully!');
  };

  const handleSetupCancel = () => {
    setShowSetup(false);
  };

  const handleDisable2FA = async () => {
    if (!disableCode || disableCode.length !== 6) {
      toast.error('Please enter a valid 6-digit code');
      return;
    }

    setDisabling(true);
    try {
      // Verify the code first
      const isValid = TwoFactorAuth.validateTOTP(profile.two_factor_secret, disableCode);
      
      if (!isValid) {
        toast.error('Invalid verification code');
        return;
      }

      // Disable 2FA
      const { error } = await supabase
        .from('profiles')
        .update({
          two_factor_enabled: false,
          two_factor_secret: null,
          backup_codes: null,
          two_factor_setup_date: null
        })
        .eq('id', user?.id);

      if (error) throw error;

      toast.success('Two-factor authentication disabled successfully!');
      setShowDisable(false);
      setDisableCode('');
      await loadProfile(); // Refresh profile data
    } catch (error) {
      console.error('Error disabling 2FA:', error);
      toast.error('Failed to disable 2FA. Please try again.');
    } finally {
      setDisabling(false);
    }
  };

  const handleGenerateNewBackupCodes = async () => {
    try {
      const newBackupCodes = TwoFactorAuth.generateBackupCodes();
      
      const { error } = await supabase
        .from('profiles')
        .update({ backup_codes: newBackupCodes })
        .eq('id', user?.id);

      if (error) throw error;

      // Download new backup codes
      const content = `Asaba Bank - New Backup Codes\n\n${newBackupCodes.join('\n')}\n\nKeep these codes safe. Each code can only be used once.`;
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'asaba-bank-new-backup-codes.txt';
      a.click();
      URL.revokeObjectURL(url);

      toast.success('New backup codes generated and downloaded!');
      await loadProfile(); // Refresh profile data
    } catch (error) {
      console.error('Error generating backup codes:', error);
      toast.error('Failed to generate new backup codes');
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (showSetup) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="max-w-md w-full mx-4">
          <TwoFactorSetup onComplete={handleSetupComplete} onCancel={handleSetupCancel} />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Two-Factor Authentication</h2>
      
      {profile?.two_factor_enabled ? (
        <div className="space-y-6">
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">Two-factor authentication is enabled</h3>
                <p className="text-sm text-green-700 mt-1">
                  Your account is protected with an additional layer of security.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-md p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Backup Codes</h3>
              <p className="text-sm text-gray-600 mb-4">
                You have {profile.backup_codes?.length || 0} backup codes remaining.
              </p>
              <button
                onClick={handleGenerateNewBackupCodes}
                className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition"
              >
                Generate New Codes
              </button>
            </div>

            <div className="bg-gray-50 rounded-md p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Disable 2FA</h3>
              <p className="text-sm text-gray-600 mb-4">
                Disable two-factor authentication for your account.
              </p>
              <button
                onClick={() => setShowDisable(true)}
                className="bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition"
              >
                Disable 2FA
              </button>
            </div>
          </div>

          {showDisable && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-md mx-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Disable Two-Factor Authentication</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Enter your authentication code to disable 2FA.
                </p>
                
                <input
                  type="text"
                  value={disableCode}
                  onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent text-center text-lg font-mono mb-4"
                  maxLength={6}
                />

                <div className="flex space-x-3">
                  <button
                    onClick={handleDisable2FA}
                    disabled={disabling || disableCode.length !== 6}
                    className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition disabled:opacity-50"
                  >
                    {disabling ? 'Disabling...' : 'Disable 2FA'}
                  </button>
                  <button
                    onClick={() => {
                      setShowDisable(false);
                      setDisableCode('');
                    }}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">Two-factor authentication is disabled</h3>
                <p className="text-sm text-yellow-700 mt-1">
                  Enable two-factor authentication to add an extra layer of security to your account.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Enable Two-Factor Authentication</h3>
            <p className="text-sm text-gray-600 mb-4">
              Two-factor authentication adds an extra layer of security to your account by requiring a verification code in addition to your password.
            </p>
            <button
              onClick={handleEnable2FA}
              className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition"
            >
              Enable 2FA
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 