'use client'

import { clearAllRecords } from '@/core/actions/clear-records';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function ClearButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleClear = async () => {
    if (!confirm('⚠️ This will permanently delete ALL applicant records. Are you sure?')) return;
    setLoading(true);
    await clearAllRecords();
    router.refresh();
    setLoading(false);
  };

  return (
    <button
      onClick={handleClear}
      disabled={loading}
      className="px-4 py-2 bg-[#ba1a1a] hover:bg-[#93000a] text-white text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
    >
      {loading ? 'Clearing...' : '🗑️ Clear All Records'}
    </button>
  );
}
