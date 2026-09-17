'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function CreateTeeTimeForm() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setIsSaving(true);
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    const body = { ...data, startTime: new Date(String(data.startTime)).toISOString() };
    const response = await fetch('/api/tee-times', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    setIsSaving(false);
    if (!response.ok) {
      setError('Tee time could not be created. Check for duplicate times or invalid pricing.');
      return;
    }
    form.reset();
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="card">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="eyebrow">Inventory</p>
          <h2 className="text-lg font-bold">Create tee time</h2>
        </div>
        <button className="btn" disabled={isSaving}>{isSaving ? 'Creating' : 'Create'}</button>
      </div>
      {error ? <p className="mt-3 text-sm font-semibold text-red-600">{error}</p> : null}
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="label">Start time<input className="input mt-1" name="startTime" type="datetime-local" required /></label>
        <label className="label">Capacity<input className="input mt-1" name="playersAllowed" type="number" min="1" max="8" defaultValue="4" required /></label>
        <label className="label">Green fee<input className="input mt-1" name="greenFee" type="number" min="0" step="0.01" defaultValue="45.00" required /></label>
        <label className="label">Cart fee<input className="input mt-1" name="cartFee" type="number" min="0" step="0.01" defaultValue="18.00" /></label>
      </div>
      <label className="label mt-3">Notes<input className="input mt-1" name="notes" maxLength={1000} /></label>
    </form>
  );
}
