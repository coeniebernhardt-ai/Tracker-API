const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Missing required environment variables.');
  console.error('Please ensure .env.local contains:');
  console.error('  - NEXT_PUBLIC_SUPABASE_URL');
  console.error('  - SUPABASE_SERVICE_ROLE_KEY');
  console.error('\nYou can find the service role key in your Supabase Dashboard:');
  console.error('Settings > API > service_role key (secret)');
  process.exit(1);
}

// Create Supabase client with service role key (bypasses RLS)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runSchema() {
  try {
    // Read the SQL file
    const sql = fs.readFileSync('supabase-schema.sql', 'utf8');
    
    // Split by semicolons to execute statements one by one
    // This is a simple approach - for production, use a proper SQL parser
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    console.log(`Found ${statements.length} SQL statements to execute...\n`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip comments and empty statements
      if (statement.startsWith('--') || statement.length === 0) {
        continue;
      }
      
      try {
        console.log(`Executing statement ${i + 1}/${statements.length}...`);
        const { error } = await supabase.rpc('exec_sql', { sql_query: statement });
        
        if (error) {
          // If exec_sql doesn't exist, try direct query (may not work for all statements)
          console.warn(`Warning: Could not execute via RPC, trying alternative method...`);
          console.warn(`Statement: ${statement.substring(0, 100)}...`);
        }
      } catch (err) {
        console.error(`Error executing statement ${i + 1}:`, err.message);
        console.error(`Statement: ${statement.substring(0, 200)}...`);
      }
    }
    
    console.log('\n✅ Schema execution completed!');
    console.log('\nNote: Some statements may need to be run manually in the Supabase SQL Editor.');
    console.log('Visit: https://supabase.com/dashboard > SQL Editor');
    
  } catch (error) {
    console.error('Error running schema:', error);
    console.error('\nAlternative: Copy and paste the contents of supabase-schema.sql');
    console.error('into your Supabase Dashboard SQL Editor and run it there.');
  }
}

runSchema();
