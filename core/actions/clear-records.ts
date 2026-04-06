'use server'

import { createClient } from '@/core/supabase/server';
import { revalidatePath } from 'next/cache';

export async function clearAllRecords() {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('applicants')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // deletes all rows

  if (error) {
    return { success: false, message: error.message };
  }

  revalidatePath('/bdo');
  return { success: true, message: 'All records cleared.' };
}
