'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSupabase } from '@/hooks/useSupabase';
import { TwoFactorAuth } from '@/lib/twoFactorAuth';
import toast from 'react-hot-toast';
import Image from 'next/image';

interface TwoFactorSetupProps {
  onComplete: () => void;
  onCancel: () => void;
}

export default function TwoFactorSetup({ onComplete, onCancel }: TwoFactorSetupProps) {
  const { user } = useAuth();
  const supabase = useSupabase();
  const [step, setStep] = useState<'setup' | 'verify' | 'backup'>('setup');
  const [secret, setSecret] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (step === 'setup') {
      generateSecret();
    }
  }, [step]);

  const generateSecret = () => {
    const newSecret = TwoFactorAuth.generateSecret();
    setSecret(newSecret);
    const qrUrl = TwoFactorAuth.generateQRCodeURL(user?.email || '', newSecret);
    console.log('Generated secret:', newSecret);
    console.log('Generated QR URL:', qrUrl);
    setQrCodeUrl(qrUrl);
  };

  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast.error('Please enter a valid 6-digit code');
      return;
    }

    setLoading(true);
    try {
      const isValid = TwoFactorAuth.validateTOTP(secret, verificationCode);
      
      if (isValid) {
        // Generate backup codes
        const codes = TwoFactorAuth.generateBackupCodes();
        setBackupCodes(codes);
        setStep('backup');
      } else {
        toast.error('Invalid verification code. Please try again.');
      }
    } catch (error) {
      toast.error('Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteSetup = async () => {
    setLoading(true);
    try {
      // Save 2FA secret and backup codes to user profile
      const { error } = await supabase
        .from('profiles')
        .update({
          two_factor_secret: secret,
          two_factor_enabled: true,
          backup_codes: backupCodes,
          two_factor_setup_date: new Date().toISOString()
        })
        .eq('id', user?.id);

      if (error) throw error;

      toast.success('Two-factor authentication enabled successfully!');
      onComplete();
    } catch (error) {
      console.error('Error enabling 2FA:', error);
      toast.error('Failed to enable 2FA. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackupCodeDownload = () => {
    const content = `Asaba Bank - Backup Codes\n\n${backupCodes.join('\n')}\n\nKeep these codes safe. Each code can only be used once.`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'asaba-bank-backup-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Enable Two-Factor Authentication</h2>
        <p className="text-gray-600">Secure your account with an additional layer of protection</p>
      </div>

      {step === 'setup' && (
        <div className="space-y-4">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-4">Step 1: Scan QR Code</h3>
            <p className="text-sm text-gray-600 mb-4">
              Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
            </p>
            
            {qrCodeUrl && (
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <Image
                    src={qrCodeUrl}
                    alt="QR Code for 2FA"
                    width={200}
                    height={200}
                    className="border border-gray-200 rounded-lg"
                    onError={(e) => {
                      console.error('QR code failed to load:', qrCodeUrl);
                      e.currentTarget.style.display = 'none';
                      // Show fallback message
                      const fallback = document.createElement('div');
                      fallback.className = 'text-center p-4 bg-gray-100 rounded-lg border border-gray-200';
                      fallback.innerHTML = `
                        <p class="text-sm text-gray-600 mb-2">QR Code could not be loaded</p>
                        <p class="text-xs text-gray-500">Please use the manual entry code below</p>
                      `;
                      e.currentTarget.parentNode?.appendChild(fallback);
                    }}
                  />
                </div>
              </div>
            )}

            <div className="bg-gray-50 p-3 rounded-md">
              <p className="text-sm text-gray-600 mb-2">Manual entry code:</p>
              <div className="flex items-center space-x-2">
                <code className="text-sm font-mono bg-white p-2 rounded border flex-1 text-center">
                  {secret}
                </code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(secret);
                    toast.success('Secret copied to clipboard!');
                  }}
                  className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Copy
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Enter this code manually in your authenticator app if the QR code doesn't work
              </p>
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={() => setStep('verify')}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition"
            >
              Next: Verify Code
            </button>
            <button
              onClick={onCancel}
              className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {step === 'verify' && (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-4">Step 2: Verify Code</h3>
            <p className="text-sm text-gray-600 mb-4">
              Enter the 6-digit code from your authenticator app
            </p>
            
            <input
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-lg font-mono"
              maxLength={6}
            />
          </div>

          <div className="flex space-x-3">
            <button
              onClick={handleVerifyCode}
              disabled={loading || verificationCode.length !== 6}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify Code'}
            </button>
            <button
              onClick={() => setStep('setup')}
              className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition"
            >
              Back
            </button>
          </div>
        </div>
      )}

      {step === 'backup' && (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-4">Step 3: Backup Codes</h3>
            <p className="text-sm text-gray-600 mb-4">
              Save these backup codes in a secure location. You can use them to access your account if you lose your authenticator device.
            </p>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
              <div className="grid grid-cols-2 gap-2">
                {backupCodes.map((code, index) => (
                  <code key={index} className="text-sm font-mono bg-white p-2 rounded border text-center">
                    {code}
                  </code>
                ))}
              </div>
            </div>

            <button
              onClick={handleBackupCodeDownload}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition mb-4"
            >
              Download Backup Codes
            </button>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={handleCompleteSetup}
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading ? 'Enabling...' : 'Complete Setup'}
            </button>
            <button
              onClick={() => setStep('verify')}
              className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition"
            >
              Back
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 