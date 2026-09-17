'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function CreatePlayerForm() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setIsSaving(true);
    const form = event.currentTarget;
    const body = Object.fromEntries(new FormData(form).entries());
    const response = await fetch('/api/players', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    setIsSaving(false);
    if (!response.ok) {
      setError('Player could not be saved. Check the details and try again.');
      return;
    }
    form.reset();
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="card">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="eyebrow">Player database</p>
          <h2 className="text-lg font-bold">Add player</h2>
        </div>
        <button className="btn" disabled={isSaving}>{isSaving ? 'Saving' : 'Save'}</button>
      </div>
      {error ? <p className="mt-3 text-sm font-semibold text-red-600">{error}</p> : null}
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="label">First name<input className="input mt-1" name="firstName" required /></label>
        <label className="label">Last name<input className="input mt-1" name="lastName" required /></label>
        <label className="label">Email<input className="input mt-1" name="email" type="email" /></label>
        <label className="label">Phone<input className="input mt-1" name="phone" /></label>
      </div>
    </form>
  );
}
