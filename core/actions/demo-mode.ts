'use server'

import { createClient } from '@/core/supabase/server';
import { revalidatePath } from 'next/cache';

/**
 * DEMO MODE: Simulates a real fraud scenario in 3 steps.
 * This is the "mic drop" moment in your hackathon presentation.
 */
export async function runFraudDemo() {
  const supabase = await createClient();
  
  // First, clear existing data for a clean demo
  await supabase.from('applicants').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  
  const fakeHash = 'demo_cert_' + Date.now(); // Same certificate hash for reuse detection
  
  // --- STEP 1: Legitimate Application (VERIFIED) ---
  await supabase.from('applicants').insert([{
    full_name: 'Rajesh Basavaraj Patil',
    father_name: 'Basavaraj Patil',
    dob: '1995-03-15',
    district: 'Kalaburagi',
    income_declared: 95000,
    income_extracted: 96000,
    scheme: 'PM-KISAN',
    status: 'verified',
    fraud_score: 0.12,
    flag_reason: '✅ QR Code Verified: Digital certificate confirmed. | AI Authenticity: 92%',
    cert_hash: fakeHash,
  }]);

  // Small delay to separate timestamps
  await new Promise(r => setTimeout(r, 1000));

  // --- STEP 2: FRAUD — Same certificate, different person! ---
  await supabase.from('applicants').insert([{
    full_name: 'Suresh Kumar Naik',
    father_name: 'Venkatesh Naik',
    dob: '1992-07-22',
    district: 'Kalaburagi',
    income_declared: 85000,
    income_extracted: 96000,
    scheme: 'PM-KISAN',
    status: 'flagged',
    fraud_score: 0.0,
    flag_reason: '🔁 Certificate Reuse Detected! This exact document was already submitted by "Rajesh Basavaraj Patil" from Kalaburagi. Possible identity fraud. | 💰 Income Discrepancy (Declared: ₹85000, Doc Extracted: ₹96000)',
    cert_hash: fakeHash, // SAME certificate hash!
  }]);

  await new Promise(r => setTimeout(r, 1000));

  // --- STEP 3: FRAUD — Same person, different district (cross-district fraud) ---
  await supabase.from('applicants').insert([{
    full_name: 'Rajesh B Patil',  // Slightly different name spelling
    father_name: 'Basavaraj Patil',
    dob: '1995-03-15', // Same DOB
    district: 'Belgaum', // DIFFERENT district!
    income_declared: 120000,
    income_extracted: 96000,
    scheme: 'PMAY',
    status: 'flagged',
    fraud_score: 0.92,
    flag_reason: '🛑 Cross-District Duplicate: 92% match with "Rajesh Basavaraj Patil" from Kalaburagi (same DOB, similar name). | 🔁 Certificate Reuse Detected! Same document used in Kalaburagi. | ⚠️ Applied to DIFFERENT scheme (PMAY vs PM-KISAN) — possible scheme hopping.',
    cert_hash: fakeHash,
  }]);

  revalidatePath('/bdo');
  return { success: true };
}
