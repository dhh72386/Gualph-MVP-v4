'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function ApplyPriceButton({ teeTimeId }: { teeTimeId: string }) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);

  async function apply() {
    setIsSaving(true);
    await fetch('/api/pricing/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teeTimeId }),
    });
    setIsSaving(false);
    router.refresh();
  }

  return <button className="btn-secondary" onClick={apply} disabled={isSaving}>{isSaving ? 'Applying' : 'Apply'}</button>;
}
