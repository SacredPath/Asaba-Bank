import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    // Determine if we're in production
    const isProduction = process.env.NODE_ENV === 'production' || 
                        process.env.VERCEL === '1' || 
                        process.env.VERCEL_URL !== undefined;
    
    // Get the origin - prioritize production URL detection
    let origin: string | null = null;
    
    // In production, ALWAYS use production URL (never localhost)
    if (isProduction) {
      // Priority: VERCEL_URL > NEXT_PUBLIC_SITE_URL > x-forwarded-host > hardcoded fallback
      if (process.env.VERCEL_URL) {
        origin = `https://${process.env.VERCEL_URL}`;
      } else if (process.env.NEXT_PUBLIC_SITE_URL) {
        origin = process.env.NEXT_PUBLIC_SITE_URL;
      } else if (req.headers['x-forwarded-host']) {
        const protocol = req.headers['x-forwarded-proto'] || 'https';
        origin = `${protocol}://${req.headers['x-forwarded-host']}`;
      } else {
        // Hardcoded production URL - UPDATE THIS with your actual domain
        origin = 'https://asaba-bank.vercel.app';
      }
      
      // Double-check: NEVER use localhost in production
      if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
        origin = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 
                 process.env.NEXT_PUBLIC_SITE_URL || 
                 'https://asaba-bank.vercel.app';
      }
    } else {
      // Development: use localhost or detected origin
      const protocol = req.headers['x-forwarded-proto'] || 'http';
      
      if (req.headers['x-forwarded-host']) {
        origin = `${protocol}://${req.headers['x-forwarded-host']}`;
      } else if (req.headers.host) {
        origin = `${protocol}://${req.headers.host}`;
      } else if (req.headers.origin) {
        origin = req.headers.origin;
      } else {
        origin = 'http://localhost:3000';
      }
    }
    
    // Ensure HTTPS in production
    if (isProduction && origin.startsWith('http://')) {
      origin = origin.replace('http://', 'https://');
    }
    
    const redirectTo = `${origin}/auth/reset-password`;
    console.log('Password reset - Environment:', {
      isProduction,
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: process.env.VERCEL,
      VERCEL_URL: process.env.VERCEL_URL,
      NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    });
    console.log('Password reset - Detected Origin:', origin);
    console.log('Password reset - Redirect URL:', redirectTo);
    console.log('Password reset - Headers:', {
      host: req.headers.host,
      'x-forwarded-host': req.headers['x-forwarded-host'],
      origin: req.headers.origin,
      referer: req.headers.referer,
      'x-forwarded-proto': req.headers['x-forwarded-proto'],
    });

    // Use resetPasswordForEmail - this actually SENDS the email
    console.log('Sending password reset email to:', email);
    console.log('Using redirect URL:', redirectTo);
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Method 1: Use resetPasswordForEmail (actually sends email)
    const { data: resetData, error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectTo,
    });

    if (!resetError) {
      console.log('✅ Password reset email sent via resetPasswordForEmail');
      console.log('Link redirects to:', redirectTo);
      return res.status(200).json({
        success: true,
        message: 'Password reset email sent successfully',
        email: email,
        method: 'resetPasswordForEmail',
        redirectTo: redirectTo,
      });
    }

    // Fallback 1: Try admin.generateLink and then send email manually
    console.log('⚠️ resetPasswordForEmail failed, trying admin.generateLink...');
    console.log('Reset error:', resetError);
    
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: redirectTo,
      },
    });

    if (!linkError && linkData?.properties?.action_link) {
      // admin.generateLink doesn't send email, so we need to use the recover endpoint
      console.log('✅ Link generated, sending via recover endpoint...');
      
      const otpResponse = await fetch(`${supabaseUrl}/auth/v1/recover`, {
        method: 'POST',
        headers: {
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          redirect_to: redirectTo,
        }),
      });

      const otpData = await otpResponse.json();

      if (!otpResponse.ok) {
        console.error('❌ Recover endpoint error:', otpData);
        return res.status(otpResponse.status).json({
          error: otpData.message || otpData.error_description || 'Failed to send reset email',
          details: otpData,
          redirectTo: redirectTo,
        });
      }

      console.log('✅ Password reset email sent via recover endpoint');
      return res.status(200).json({
        success: true,
        message: 'Password reset email sent successfully',
        email: email,
        method: 'recover',
        redirectTo: redirectTo,
      });
    }

    // Final fallback: Direct recover endpoint call
    console.log('⚠️ All methods failed, trying direct recover endpoint...');
    const finalResponse = await fetch(`${supabaseUrl}/auth/v1/recover`, {
      method: 'POST',
      headers: {
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email,
        redirect_to: redirectTo,
      }),
    });

    const finalData = await finalResponse.json();

    if (!finalResponse.ok) {
      console.error('❌ Final recover attempt failed:', finalData);
      return res.status(finalResponse.status).json({
        error: finalData.message || finalData.error_description || 'Failed to send reset email',
        details: finalData,
        redirectTo: redirectTo,
      });
    }

    console.log('✅ Password reset email sent via direct recover endpoint');
    return res.status(200).json({
      success: true,
      message: 'Password reset email sent successfully',
      email: email,
      method: 'direct-recover',
      redirectTo: redirectTo,
    });
  } catch (error: any) {
    console.error('Error sending password reset:', error);
    return res.status(500).json({
      error: 'Failed to send password reset email',
      message: error.message,
    });
  }
}

