require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables!');
  console.error('Please ensure .env.local contains:');
  console.error('  - NEXT_PUBLIC_SUPABASE_URL');
  console.error('  - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create Supabase admin client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Get email and redirect URL from command line arguments
// Default to production URL if NEXT_PUBLIC_SITE_URL is set
const defaultRedirect = process.env.NEXT_PUBLIC_SITE_URL 
  ? `${process.env.NEXT_PUBLIC_SITE_URL}/auth/reset-password`
  : 'http://localhost:3000/auth/reset-password';
const email = process.argv[2];
const redirectUrl = process.argv[3] || defaultRedirect;

if (!email) {
  console.error('❌ Please provide an email address');
  console.error('Usage: node scripts/send-password-reset.js <email> [redirectUrl]');
  process.exit(1);
}

async function sendPasswordReset() {
  console.log('📧 Sending Password Reset Email...\n');
  console.log('='.repeat(60));
  console.log(`Email: ${email}`);
  console.log(`Redirect URL: ${redirectUrl}`);
  console.log(`Supabase URL: ${supabaseUrl.substring(0, 40)}...`);
  console.log('='.repeat(60));

  try {
    // Method 1: Use admin.generateLink (recommended)
    console.log('\n1️⃣ Using admin.generateLink method...');
    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: redirectUrl,
      },
    });

    if (error) {
      console.error('❌ Error:', error.message);
      console.error('Code:', error.status || 'N/A');
      
      // Fallback to OTP method
      console.log('\n2️⃣ Trying OTP method as fallback...');
      await sendOTP();
      return;
    }

    if (data) {
      console.log('✅ Password reset link generated successfully!');
      console.log('📧 Email sent to:', email);
      console.log('\n📋 Link details:');
      console.log('  - Action Link:', data.properties?.action_link || 'N/A');
      console.log('  - Email OTP:', data.properties?.email_otp || 'N/A');
      console.log('  - Hashed Token:', data.properties?.hashed_token ? 'Present' : 'N/A');
      console.log('\n💡 The user will receive an email with a password reset link.');
      console.log('   The link will redirect to:', redirectUrl);
    }

  } catch (error) {
    console.error('\n❌ Unexpected error:', error.message);
    process.exit(1);
  }
}

async function sendOTP() {
  try {
    const response = await fetch(`${supabaseUrl}/auth/v1/otp`, {
      method: 'POST',
      headers: {
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ OTP Error:', data.message || data.error_description || 'Unknown error');
      console.error('Status:', response.status);
      process.exit(1);
    }

    console.log('✅ OTP sent successfully!');
    console.log('📧 Check the inbox for:', email);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the function
sendPasswordReset();

