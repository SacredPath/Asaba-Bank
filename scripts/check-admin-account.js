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

// Create Supabase admin client
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAdminAccount() {
  console.log('🔍 Checking for Admin Account...\n');
  console.log('='.repeat(60));
  console.log(`📊 Supabase URL: ${supabaseUrl.substring(0, 40)}...`);
  console.log('='.repeat(60));

  const adminEmail = 'admin@asabacorp.com';

  try {
    // Check 1: Look for user in auth.users
    console.log('\n1️⃣ Checking Authentication (auth.users)...');
    console.log('─'.repeat(60));
    
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      console.log(`   ❌ Error: ${usersError.message}`);
    } else {
      const adminUser = users.users?.find(u => u.email === adminEmail);
      
      if (adminUser) {
        console.log(`   ✅ Admin user found in auth.users`);
        console.log(`   📧 Email: ${adminUser.email}`);
        console.log(`   🆔 User ID: ${adminUser.id}`);
        console.log(`   📅 Created: ${new Date(adminUser.created_at).toLocaleString()}`);
        console.log(`   🔐 Email Confirmed: ${adminUser.email_confirmed_at ? 'Yes' : 'No'}`);
        console.log(`   👤 Metadata:`, adminUser.user_metadata);
      } else {
        console.log(`   ❌ Admin user NOT found in auth.users`);
        console.log(`   📊 Total users found: ${users.users?.length || 0}`);
        if (users.users && users.users.length > 0) {
          console.log(`   📋 Existing users:`);
          users.users.slice(0, 5).forEach((u, i) => {
            console.log(`      ${i + 1}. ${u.email} (${u.id.substring(0, 8)}...)`);
          });
        }
      }
    }

    // Check 2: Look for profile in profiles table
    console.log('\n2️⃣ Checking Profiles Table...');
    console.log('─'.repeat(60));
    
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', adminEmail);

    if (profilesError) {
      console.log(`   ❌ Error: ${profilesError.message}`);
      console.log(`   Code: ${profilesError.code || 'N/A'}`);
      if (profilesError.code === 'PGRST116') {
        console.log('   💡 Hint: Profiles table might not exist. Run migrations first.');
      }
    } else {
      if (profiles && profiles.length > 0) {
        const profile = profiles[0];
        console.log(`   ✅ Admin profile found in profiles table`);
        console.log(`   📧 Email: ${profile.email}`);
        console.log(`   🆔 Profile ID: ${profile.id}`);
        console.log(`   👤 Full Name: ${profile.full_name || 'N/A'}`);
        console.log(`   🔑 Role: ${profile.role || 'N/A'}`);
        console.log(`   💰 Checking Balance: $${profile.checking_balance || '0.00'}`);
        console.log(`   💰 Savings Balance: $${profile.savings_balance || '0.00'}`);
        console.log(`   📅 Created: ${profile.created_at ? new Date(profile.created_at).toLocaleString() : 'N/A'}`);
        
        // Check if role is set to admin
        if (profile.role === 'admin') {
          console.log(`   ✅ Role is correctly set to 'admin'`);
        } else {
          console.log(`   ⚠️  Role is '${profile.role || 'user'}' - needs to be set to 'admin'`);
        }
      } else {
        console.log(`   ❌ Admin profile NOT found in profiles table`);
        
        // Check total profiles
        const { data: allProfiles } = await supabase
          .from('profiles')
          .select('email, role')
          .limit(10);
        
        if (allProfiles && allProfiles.length > 0) {
          console.log(`   📊 Total profiles found: ${allProfiles.length}`);
          console.log(`   📋 Sample profiles:`);
          allProfiles.slice(0, 5).forEach((p, i) => {
            console.log(`      ${i + 1}. ${p.email} (role: ${p.role || 'user'})`);
          });
        } else {
          console.log(`   📊 No profiles found in database`);
        }
      }
    }

    // Check 3: Verify accounts exist for admin
    console.log('\n3️⃣ Checking Accounts for Admin...');
    console.log('─'.repeat(60));
    
    if (profiles && profiles.length > 0) {
      const adminProfile = profiles[0];
      const { data: accounts, error: accountsError } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', adminProfile.id);

      if (accountsError) {
        console.log(`   ❌ Error: ${accountsError.message}`);
      } else {
        if (accounts && accounts.length > 0) {
          console.log(`   ✅ Found ${accounts.length} account(s) for admin`);
          accounts.forEach((acc, i) => {
            console.log(`      ${i + 1}. ${acc.account_name} (${acc.account_type}) - $${acc.balance || '0.00'}`);
          });
        } else {
          console.log(`   ⚠️  No accounts found for admin user`);
          console.log(`   💡 Accounts should be auto-created on user registration`);
        }
      }
    } else {
      console.log(`   ⏭️  Skipped (no admin profile found)`);
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 Summary:');
    console.log('─'.repeat(60));
    
    const { data: authUsers } = await supabase.auth.admin.listUsers();
    const adminAuthUser = authUsers?.users?.find(u => u.email === adminEmail);
    const adminProfile = profiles && profiles.length > 0 ? profiles[0] : null;
    
    if (adminAuthUser && adminProfile && adminProfile.role === 'admin') {
      console.log('✅ Admin account is FULLY SET UP');
      console.log(`   - Auth user: ✅ Exists`);
      console.log(`   - Profile: ✅ Exists with admin role`);
      console.log(`\n🔐 Login Credentials:`);
      console.log(`   Email: ${adminEmail}`);
      console.log(`   Password: Max@123.net (default)`);
      console.log(`\n🌐 Access URLs:`);
      console.log(`   Login: /auth/login`);
      console.log(`   Admin Dashboard: /admin/dashboard`);
    } else if (adminAuthUser && adminProfile) {
      console.log('⚠️  Admin account PARTIALLY SET UP');
      console.log(`   - Auth user: ✅ Exists`);
      console.log(`   - Profile: ✅ Exists but role is '${adminProfile.role || 'user'}'`);
      console.log(`\n💡 To fix: Run this SQL in Supabase SQL Editor:`);
      console.log(`   UPDATE profiles SET role = 'admin' WHERE email = '${adminEmail}';`);
    } else if (adminAuthUser) {
      console.log('⚠️  Admin account PARTIALLY SET UP');
      console.log(`   - Auth user: ✅ Exists`);
      console.log(`   - Profile: ❌ Missing`);
      console.log(`\n💡 To fix: Run the setup script:`);
      console.log(`   node scripts/setup-admin.js`);
    } else {
      console.log('❌ Admin account DOES NOT EXIST');
      console.log(`\n💡 To create: Run the setup script:`);
      console.log(`   node scripts/setup-admin.js`);
    }
    
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n❌ Unexpected error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run check
checkAdminAccount();

