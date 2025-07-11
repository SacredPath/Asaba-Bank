import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useSupabase } from '@/hooks/useSupabase';
import LoadingOverlay from '@/components/LoadingOverlay';

// Simple client-side rate limiting
let loginAttempts = 0;
let lastAttemptTime = 0;
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

function Login() {
  const supabase = useSupabase();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutTime, setLockoutTime] = useState(0);

  // Check if account is locked
  useEffect(() => {
    const now = Date.now();
    if (now - lastAttemptTime < LOCKOUT_DURATION && loginAttempts >= MAX_ATTEMPTS) {
      setIsLocked(true);
      setLockoutTime(LOCKOUT_DURATION - (now - lastAttemptTime));
    } else if (now - lastAttemptTime >= LOCKOUT_DURATION) {
      loginAttempts = 0;
      setIsLocked(false);
    }
  }, []);

  // Countdown timer for lockout
  useEffect(() => {
    if (isLocked && lockoutTime > 0) {
      const timer = setInterval(() => {
        setLockoutTime(prev => {
          if (prev <= 1000) {
            setIsLocked(false);
            loginAttempts = 0;
            return 0;
          }
          return prev - 1000;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isLocked, lockoutTime]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    
    if (isLocked) {
      setErrorMsg('Account temporarily locked. Please try again later.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      // Simulate 3-second delay for better UX
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        loginAttempts++;
        lastAttemptTime = Date.now();
        
        // Log failed login attempt
        // await auditLogger.logFailedLogin(
        //   email,
        //   'client-ip', // In production, get actual IP
        //   navigator.userAgent
        // );
        
        if (loginAttempts >= MAX_ATTEMPTS) {
          setIsLocked(true);
          setLockoutTime(LOCKOUT_DURATION);
          setErrorMsg('Too many failed attempts. Account locked for 15 minutes.');
          
          // Log account lockout
          // await auditLogger.logEvent({
          //   event_type: 'account_lockout',
          //   ip_address: 'client-ip',
          //   user_agent: navigator.userAgent,
          //   details: { email, attempts: loginAttempts },
          //   severity: 'high',
          // });
        } else {
          setErrorMsg(error.message || 'Invalid credentials');
        }
        setLoading(false);
        return;
      }

      // Reset attempts on successful login
      loginAttempts = 0;
      
      // Log successful login
      // if (data.user) {
      //   await auditLogger.logLogin(
      //     data.user.id,
      //     'client-ip', // In production, get actual IP
      //     navigator.userAgent,
      //     true
      //   );
      // }
      
      // Success: redirect immediately
      router.push('/dashboard');
    } catch (error) {
      setErrorMsg('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  }

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f3f4f6',
      padding: '1rem'
    }}>
      {loading && <LoadingOverlay isVisible={loading} message="Logging In..." />}
      <div style={{
        width: '100%',
        maxWidth: '400px',
        backgroundColor: '#ffffff',
        borderRadius: '0.5rem',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
        padding: '2rem',
        marginBottom: '2rem'
      }}>
        <div style={{
          textAlign: 'center',
          marginBottom: '2rem'
        }}>
          <Image
            src="/logo.png"
            alt="Asaba Bank Logo"
            width={120}
            height={40}
            style={{ margin: '0 auto 1rem' }}
          />
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: '600',
            color: '#111827',
            margin: '0',
            textAlign: 'center'
          }}>
            Sign in to your account
          </h2>
        </div>
        
        {isLocked ? (
          <div style={{
            textAlign: 'center',
            padding: '1rem',
            backgroundColor: '#fef2f2',
            borderRadius: '0.375rem',
            border: '1px solid #fecaca',
            color: '#dc2626'
          }}>
            <p>Account temporarily locked</p>
            <p>Time remaining: {formatTime(lockoutTime)}</p>
          </div>
        ) : (
          <form onSubmit={handleLogin}>
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '0.5rem'
              }} htmlFor="email">
                Email address
              </label>
              <div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.375rem',
                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                    fontSize: '0.875rem',
                    color: '#1f2937',
                    backgroundColor: '#fff',
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  placeholder="Enter your email"
                  disabled={loading}
                />
              </div>
            </div>
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '0.5rem'
              }} htmlFor="password">
                Password
              </label>
              <div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.375rem',
                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                    fontSize: '0.875rem',
                    color: '#1f2937',
                    backgroundColor: '#fff',
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  placeholder="Enter your password"
                  disabled={loading}
                />
              </div>
            </div>

            {errorMsg && (
              <div style={{
                color: '#ef4444',
                fontSize: '0.875rem',
                textAlign: 'center',
                marginTop: '0.5rem'
              }}>
                {errorMsg}
              </div>
            )}

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{
                fontSize: '0.875rem'
              }}>
                <a href="/auth/reset-password" style={{
                  color: '#3b82f6',
                  textDecoration: 'none'
                }}>
                  Forgot your password?
                </a>
              </div>
              <div style={{
                fontSize: '0.875rem'
              }}>
                <a href="/account/open/step1" style={{
                  color: '#3b82f6',
                  textDecoration: 'none'
                }}>
                  Open a new account
                </a>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading || isLocked}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: 'none',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#fff',
                  backgroundColor: loading || isLocked ? '#9ca3af' : '#3b82f6',
                  cursor: loading || isLocked ? 'not-allowed' : 'pointer',
                  transition: 'background-color 0.2s'
                }}
              >
                Sign in
              </button>
            </div>
          </form>
        )}
      </div>
      {/* Footer */}
      <footer style={{
        width: '100%',
        maxWidth: 400,
        background: '#f9fafb',
        borderRadius: '0.5rem',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        padding: '1.5rem 1rem',
        fontSize: '0.95rem',
        color: '#374151',
        textAlign: 'center',
        lineHeight: 1.6
      }}>
        <div style={{ marginBottom: '0.5rem', fontWeight: 600 }}>
          NMLS number: 403503<br/>
          Routing number: 091000022
        </div>
        <div style={{ marginBottom: '0.5rem' }}>
          123 Main Street<br/>
          Minneapolis, MN 55401<br/>
          1-800-908-6600
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <a href="https://play.google.com/store" target="_blank" rel="noopener noreferrer" aria-label="Google Play Store">
            <img src="/google-play.svg" alt="Google Play Store" style={{ height: 36 }} />
          </a>
          <a href="https://www.apple.com/app-store/" target="_blank" rel="noopener noreferrer" aria-label="Apple App Store">
            <img src="/apple-store.svg" alt="Apple App Store" style={{ height: 36 }} />
          </a>
        </div>
        <nav style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0.75rem', marginBottom: '0.5rem', fontSize: '0.93rem' }}>
          <a href="/" style={{ color: '#2563eb', textDecoration: 'none' }}>Home</a>
          <a href="/mobile" style={{ color: '#2563eb', textDecoration: 'none' }}>Mobile</a>
          <a href="/browser-support" style={{ color: '#2563eb', textDecoration: 'none' }}>Browser Support</a>
          <a href="/contact" style={{ color: '#2563eb', textDecoration: 'none' }}>Contact Us</a>
          <a href="/privacy" style={{ color: '#2563eb', textDecoration: 'none' }}>Privacy Policy</a>
          <a href="/dashboard/support" style={{ color: '#2563eb', textDecoration: 'none' }}>Get CoBrowsing Code</a>
        </nav>
        <div style={{ marginBottom: '0.5rem', fontWeight: 500, color: '#059669' }}>
          FDIC-Insured - Backed by the full faith and credit of the U.S. Government
        </div>
        <div style={{ fontSize: '0.92rem', color: '#6b7280' }}>
          &copy; 2025 All rights reserved.
        </div>
      </footer>
    </div>
  );
}

export default Login;
