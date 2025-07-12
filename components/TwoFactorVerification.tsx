'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSupabase } from '@/hooks/useSupabase';
import { TwoFactorAuth } from '@/lib/twoFactorAuth';
import toast from 'react-hot-toast';

interface TwoFactorVerificationProps {
  onSuccess: () => void;
  onCancel: () => void;
  userId: string;
  secret: string;
  backupCodes: string[];
}

export default function TwoFactorVerification({ 
  onSuccess, 
  onCancel, 
  userId, 
  secret, 
  backupCodes 
}: TwoFactorVerificationProps) {
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCode, setBackupCode] = useState('');
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [loading, setLoading] = useState(false);
  const supabase = useSupabase();

  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast.error('Please enter a valid 6-digit code');
      return;
    }

    setLoading(true);
    try {
      const isValid = TwoFactorAuth.validateTOTP(secret, verificationCode);
      
      if (isValid) {
        // Log successful 2FA verification
        await supabase.from('audit_logs').insert({
          user_id: userId,
          action: '2fa_verification_success',
          details: { method: 'totp' },
          severity: 'medium'
        });
        
        toast.success('Verification successful!');
        onSuccess();
      } else {
        toast.error('Invalid verification code. Please try again.');
      }
    } catch (error) {
      toast.error('Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackupCode = async () => {
    if (!backupCode || backupCode.length !== 8) {
      toast.error('Please enter a valid 8-character backup code');
      return;
    }

    setLoading(true);
    try {
      const isValid = TwoFactorAuth.validateBackupCode([...backupCodes], backupCode);
      
      if (isValid) {
        // Update backup codes in database (remove used code)
        const updatedBackupCodes = backupCodes.filter(code => code !== backupCode.toUpperCase());
        
        await supabase
          .from('profiles')
          .update({ backup_codes: updatedBackupCodes })
          .eq('id', userId);

        // Log successful backup code usage
        await supabase.from('audit_logs').insert({
          user_id: userId,
          action: '2fa_backup_code_used',
          details: { method: 'backup_code' },
          severity: 'medium'
        });
        
        toast.success('Backup code accepted!');
        onSuccess();
      } else {
        toast.error('Invalid backup code. Please try again.');
      }
    } catch (error) {
      toast.error('Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Two-Factor Authentication</h2>
        <p className="text-gray-600">Enter your verification code to continue</p>
      </div>

      {!useBackupCode ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Authentication Code
            </label>
            <input
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-lg font-mono"
              maxLength={6}
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter the 6-digit code from your authenticator app
            </p>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={handleVerifyCode}
              disabled={loading || verificationCode.length !== 6}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify'}
            </button>
            <button
              onClick={() => setUseBackupCode(true)}
              className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition"
            >
              Use Backup Code
            </button>
          </div>

          <button
            onClick={onCancel}
            className="w-full text-gray-500 hover:text-gray-700 text-sm"
          >
            Cancel
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Backup Code
            </label>
            <input
              type="text"
              value={backupCode}
              onChange={(e) => setBackupCode(e.target.value.replace(/[^A-F0-9]/gi, '').slice(0, 8))}
              placeholder="XXXXXXXX"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-lg font-mono uppercase"
              maxLength={8}
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter one of your 8-character backup codes
            </p>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={handleBackupCode}
              disabled={loading || backupCode.length !== 8}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify Backup Code'}
            </button>
            <button
              onClick={() => setUseBackupCode(false)}
              className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition"
            >
              Use App Code
            </button>
          </div>

          <button
            onClick={onCancel}
            className="w-full text-gray-500 hover:text-gray-700 text-sm"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
} 