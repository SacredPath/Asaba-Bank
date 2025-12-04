require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

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

// Define migration order
const migrations = [
  // Core table creations (order matters due to foreign keys)
  'supabase/migrations/20250710_create_accounts.sql',
  'supabase/migrations/20250710_create_recipients.sql',
  'supabase/migrations/20250710_create_transactions.sql',
  'supabase/migrations/20250710_create_tickets.sql',
  'supabase/migrations/20250710_create_audit_logs.sql',
  
  // Add fields to existing tables
  'supabase/migrations/20250710_add_account_fields.sql',
  'supabase/migrations/20250710_add_2fa_fields.sql',
  
  // RLS fixes (run after tables are created)
  'fix_recipients_rls_final.sql',
  'fix_transactions_rls_final.sql',
  'fix_tickets_rls_complete.sql',
  
  // Utility scripts
  'supabase/migrations/20250710_check_profiles.sql',
];

async function runSQLFile(filePath) {
  const fullPath = path.join(process.cwd(), filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`   ⚠️  File not found: ${filePath}`);
    return { success: false, error: 'File not found' };
  }

  const sql = fs.readFileSync(fullPath, 'utf8');
  
  // Skip empty files or comment-only files
  if (!sql.trim() || sql.trim().startsWith('--')) {
    console.log(`   ⏭️  Skipped (empty or comments only)`);
    return { success: true, skipped: true };
  }

  try {
    // Execute SQL using Supabase RPC or direct query
    // Note: Supabase JS client doesn't support arbitrary SQL execution
    // We'll need to use the REST API or provide instructions
    console.log(`   📝 SQL file loaded (${sql.split('\n').length} lines)`);
    console.log(`   💡 Note: This script loads the SQL. Run it in Supabase SQL Editor.`);
    return { success: true, sql };
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runMigrations() {
  console.log('🚀 Running All Database Migrations\n');
  console.log('='.repeat(60));
  console.log(`📊 Supabase URL: ${supabaseUrl.substring(0, 40)}...`);
  console.log('='.repeat(60));

  const results = [];
  let successCount = 0;
  let skipCount = 0;
  let failCount = 0;

  for (let i = 0; i < migrations.length; i++) {
    const migration = migrations[i];
    const fileName = path.basename(migration);
    
    console.log(`\n[${i + 1}/${migrations.length}] ${fileName}`);
    console.log('─'.repeat(60));
    
    const result = await runSQLFile(migration);
    results.push({ file: migration, ...result });
    
    if (result.skipped) {
      skipCount++;
    } else if (result.success) {
      successCount++;
    } else {
      failCount++;
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Migration Summary:');
  console.log('─'.repeat(60));
  console.log(`✅ Successfully loaded: ${successCount}`);
  console.log(`⏭️  Skipped: ${skipCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log(`📁 Total: ${migrations.length}`);

  // Generate SQL file with all migrations combined
  console.log('\n📝 Generating combined SQL file...');
  const combinedSQL = results
    .filter(r => r.success && r.sql)
    .map(r => `-- ============================================\n-- ${r.file}\n-- ============================================\n\n${r.sql}\n\n`)
    .join('\n');

  if (combinedSQL) {
    const outputPath = path.join(process.cwd(), 'scripts', 'all-migrations-combined.sql');
    fs.writeFileSync(outputPath, combinedSQL);
    console.log(`✅ Combined SQL file created: ${outputPath}`);
    console.log(`\n💡 To run all migrations:`);
    console.log(`   1. Open Supabase Dashboard`);
    console.log(`   2. Go to SQL Editor`);
    console.log(`   3. Copy and paste the contents of: ${outputPath}`);
    console.log(`   4. Click "Run"`);
  }

  // Alternative: Try to execute via Supabase REST API
  console.log('\n🔧 Attempting to execute migrations via Supabase API...');
  console.log('─'.repeat(60));

  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    if (!result.success || result.skipped || !result.sql) continue;

    const fileName = path.basename(result.file);
    console.log(`\n[${i + 1}/${results.length}] Executing: ${fileName}`);

    try {
      // Split SQL by semicolons and execute each statement
      const statements = result.sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s && !s.startsWith('--') && s.length > 10);

      for (const statement of statements) {
        // Skip certain statements that can't be run via API
        if (statement.includes('CREATE POLICY') || 
            statement.includes('DROP POLICY') ||
            statement.includes('ALTER TABLE') ||
            statement.includes('CREATE TABLE') ||
            statement.includes('CREATE FUNCTION') ||
            statement.includes('CREATE TRIGGER')) {
          
          // Try to execute via RPC or direct query
          // Note: This is limited - some SQL needs to run in SQL Editor
          try {
            // For simple SELECT statements, we can test them
            if (statement.trim().toUpperCase().startsWith('SELECT')) {
              const { error } = await supabase.rpc('exec_sql', { sql_query: statement });
              if (error) {
                console.log(`   ⚠️  Could not execute via API (run in SQL Editor)`);
              }
            }
          } catch (e) {
            // Ignore - these need to run in SQL Editor
          }
        }
      }
      
      console.log(`   ✅ SQL prepared (run in Supabase SQL Editor)`);
    } catch (error) {
      console.log(`   ⚠️  ${error.message}`);
      console.log(`   💡 Run this file manually in Supabase SQL Editor`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📋 Next Steps:');
  console.log('─'.repeat(60));
  console.log('1. Open your Supabase Dashboard');
  console.log('2. Navigate to SQL Editor');
  console.log('3. Copy the contents of: scripts/all-migrations-combined.sql');
  console.log('4. Paste and run in the SQL Editor');
  console.log('\n✨ Or run each migration file individually in order');
  console.log('='.repeat(60));
}

// Run migrations
runMigrations().catch(console.error);

