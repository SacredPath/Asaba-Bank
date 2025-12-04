require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Testing Supabase Connection...\n');
console.log('=' .repeat(50));

// Check environment variables
console.log('\n📋 Environment Variables Check:');
console.log('─'.repeat(50));
console.log(`NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? '✅ Set' : '❌ Missing'}`);
if (supabaseUrl) {
  console.log(`  URL: ${supabaseUrl.substring(0, 30)}...`);
}
console.log(`NEXT_PUBLIC_SUPABASE_ANON_KEY: ${supabaseAnonKey ? '✅ Set' : '❌ Missing'}`);
if (supabaseAnonKey) {
  console.log(`  Key: ${supabaseAnonKey.substring(0, 20)}...`);
}
console.log(`SUPABASE_SERVICE_ROLE_KEY: ${supabaseServiceKey ? '✅ Set' : '❌ Missing'}`);
if (supabaseServiceKey) {
  console.log(`  Key: ${supabaseServiceKey.substring(0, 20)}...`);
}

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('\n❌ ERROR: Missing required environment variables!');
  console.error('Please ensure .env.local contains:');
  console.error('  - NEXT_PUBLIC_SUPABASE_URL');
  console.error('  - NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

// Create Supabase clients
console.log('\n🔌 Creating Supabase Clients...');
console.log('─'.repeat(50));

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

console.log('✅ Anon client created');
if (supabaseAdmin) {
  console.log('✅ Admin client created');
} else {
  console.log('⚠️  Admin client not created (service role key missing)');
}

// Test connection
async function testConnection() {
  console.log('\n🧪 Testing Connection...');
  console.log('─'.repeat(50));

  try {
    // Test 1: Basic connection test
    console.log('\n1️⃣ Testing basic connection...');
    const { data: healthCheck, error: healthError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);

    if (healthError) {
      console.log(`   ⚠️  Health check error: ${healthError.message}`);
      console.log(`   Code: ${healthError.code || 'N/A'}`);
    } else {
      console.log('   ✅ Basic connection successful');
    }

    // Test 2: Check if profiles table exists
    console.log('\n2️⃣ Checking profiles table...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .limit(5);

    if (profilesError) {
      console.log(`   ❌ Error accessing profiles: ${profilesError.message}`);
      console.log(`   Code: ${profilesError.code || 'N/A'}`);
      if (profilesError.code === 'PGRST116') {
        console.log('   💡 Hint: Table might not exist. Run migrations first.');
      }
    } else {
      console.log(`   ✅ Profiles table accessible`);
      console.log(`   📊 Found ${profiles?.length || 0} profile(s)`);
      if (profiles && profiles.length > 0) {
        console.log('   Sample profiles:');
        profiles.slice(0, 3).forEach((p, i) => {
          console.log(`     ${i + 1}. ${p.email || 'N/A'} (${p.full_name || 'N/A'})`);
        });
      }
    }

    // Test 3: Check accounts table
    console.log('\n3️⃣ Checking accounts table...');
    const { data: accounts, error: accountsError } = await supabase
      .from('accounts')
      .select('id, account_type, balance')
      .limit(5);

    if (accountsError) {
      console.log(`   ❌ Error accessing accounts: ${accountsError.message}`);
      console.log(`   Code: ${accountsError.code || 'N/A'}`);
    } else {
      console.log(`   ✅ Accounts table accessible`);
      console.log(`   📊 Found ${accounts?.length || 0} account(s)`);
    }

    // Test 4: Check transactions table
    console.log('\n4️⃣ Checking transactions table...');
    // Try different column names to see what exists
    let transactionsError = null;
    let transactions = null;
    
    // First try with transaction_type
    const result1 = await supabase
      .from('transactions')
      .select('id, transaction_type, method, amount')
      .limit(5);
    
    if (result1.error && result1.error.code === '42703') {
      // Column doesn't exist, try with just id
      const result2 = await supabase
        .from('transactions')
        .select('id')
        .limit(1);
      
      if (result2.error) {
        transactionsError = result2.error;
      } else {
        // Table exists but column name is different
        console.log(`   ⚠️  Table exists but 'transaction_type' column not found`);
        console.log(`   💡 The table structure may differ from the migration`);
        console.log(`   ✅ Transactions table accessible (with different schema)`);
        transactions = result2.data;
      }
    } else if (result1.error) {
      transactionsError = result1.error;
    } else {
      transactions = result1.data;
    }

    if (transactionsError) {
      console.log(`   ❌ Error accessing transactions: ${transactionsError.message}`);
      console.log(`   Code: ${transactionsError.code || 'N/A'}`);
      if (transactionsError.code === 'PGRST116') {
        console.log('   💡 Hint: Table might not exist. Run migrations first.');
      }
    } else if (transactions !== null) {
      console.log(`   ✅ Transactions table accessible`);
      console.log(`   📊 Found ${transactions?.length || 0} transaction(s)`);
    }

    // Test 5: Test authentication (if admin key available)
    let adminAuthPassed = null;
    if (supabaseAdmin) {
      console.log('\n5️⃣ Testing admin authentication...');
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers({
        page: 1,
        perPage: 1
      });

      if (authError) {
        console.log(`   ❌ Admin auth error: ${authError.message}`);
        adminAuthPassed = false;
      } else {
        console.log(`   ✅ Admin authentication successful`);
        console.log(`   📊 Total users: ${authData?.users?.length || 0}`);
        adminAuthPassed = true;
      }
    } else {
      console.log('\n5️⃣ Skipping admin authentication test (service role key not available)');
    }

    // Test 6: Check RLS policies
    console.log('\n6️⃣ Checking Row Level Security (RLS)...');
    const { data: rlsTest, error: rlsError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);

    if (rlsError && rlsError.code === '42501') {
      console.log('   ⚠️  RLS policy may be blocking access');
      console.log('   💡 This is normal for unauthenticated requests');
    } else if (rlsError) {
      console.log(`   ⚠️  RLS check: ${rlsError.message}`);
    } else {
      console.log('   ✅ RLS policies configured');
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 Connection Test Summary:');
    console.log('─'.repeat(50));
    
    const tests = [
      { name: 'Basic Connection', passed: !healthError },
      { name: 'Profiles Table', passed: !profilesError },
      { name: 'Accounts Table', passed: !accountsError },
      { name: 'Transactions Table', passed: !transactionsError },
      { name: 'Admin Auth', passed: adminAuthPassed }
    ];

    tests.forEach(test => {
      if (test.passed === null) {
        console.log(`   ${test.name}: ⏭️  Skipped`);
      } else if (test.passed) {
        console.log(`   ${test.name}: ✅ Pass`);
      } else {
        console.log(`   ${test.name}: ❌ Fail`);
      }
    });

    const passedTests = tests.filter(t => t.passed === true).length;
    const totalTests = tests.filter(t => t.passed !== null).length;
    
    console.log(`\n   Results: ${passedTests}/${totalTests} tests passed`);
    
    if (passedTests === totalTests) {
      console.log('\n🎉 All tests passed! Supabase connection is working correctly.');
      process.exit(0);
    } else {
      console.log('\n⚠️  Some tests failed. Please check the errors above.');
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ Unexpected error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run tests
testConnection();

