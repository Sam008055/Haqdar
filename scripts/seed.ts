import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load the local environment variables containing your keys
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase keys in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  console.log('Seeding Hackathon Demo Data...');

  // 1. Create a mock CSC operator
  const { data: operator, error: opError } = await supabase
    .from('operators')
    .insert([{ csc_code: 'CSC-DL-88421' }])
    .select()
    .single();

  if (opError) {
    if (opError.code === '23505') {
       console.log('Operator already exists, proceeding...');
    } else {
       console.error('Failed to create operator:', opError.message);
       return;
    }
  }

  // Fetch the operator to get the ID
  const { data: opData } = await supabase.from('operators').select('id').limit(1).single();
  const operatorId = opData?.id;

  // 2. Insert a valid Application (The 'Base' application)
  console.log('Inserting valid Base Applicant: Rajesh Kumar');
  await supabase.from('applicants').insert([{
    operator_id: operatorId,
    full_name: 'Rajesh Kumar',
    father_name: 'Suresh Kumar',
    dob: '1985-05-15',
    district: 'Lucknow',
    income_declared: 150000,
    scheme: 'PM-KISAN',
    status: 'verified',
    fraud_score: 0
  }]);

  // 3. To demo the Trigram Fuzzy matching during the presentation,
  // we will insert a 'Fraudulent Twin' application simulating a typo:
  // "Rajsh Kumar", same DOB and district.
  console.log('Inserting Trigram Fuzzy Match Target...');
  
  const { error: seedError } = await supabase.from('applicants').insert([{
    operator_id: operatorId,
    full_name: 'Rajsh Kumar',  // Typo here
    father_name: 'Suresh Kumar',
    dob: '1985-05-15',
    district: 'Lucknow',
    income_declared: 150000,
    scheme: 'PM-KISAN',
    status: 'flagged',
    fraud_score: 0.92,
    flag_reason: 'High Duplicate Match Probability: 92%'
  }]);

  if (seedError) {
    console.error('Error seeding data:', seedError);
  } else {
    console.log('✅ Seeding Complete. Your database is primed for the live demo!');
  }
}

seed();
