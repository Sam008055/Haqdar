import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function clearDB() {
  console.log('🧹 Attempting to clear testing logs from the `applicants` table...');
  const { error } = await supabase
    .from('applicants')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Deletes all rows

  if (error) {
    console.error('❌ Failed to clear database. You may have Row Level Security (RLS) enabled preventing anon deletions.');
    console.error(error.message);
    console.log('\n👉 To fix this, simply log into your Supabase Dashboard -> Table Editor -> `applicants` -> Delete all rows mentally.');
  } else {
    console.log('✅ Success! All logs have been cleared. You are fresh to test again.');
  }
}

clearDB();
