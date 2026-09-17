'use client';

import { useState } from 'react';

export function PublicBookingForm({ teeTimeId, maxPartySize }: { teeTimeId: string; maxPartySize: number }) {
  const [message, setMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');
    setIsSaving(true);
    const form = event.currentTarget;
    const body = { teeTimeId, ...Object.fromEntries(new FormData(form).entries()) };
    const response = await fetch('/api/public/reservations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    setIsSaving(false);
    if (!response.ok) {
      setMessage('This tee time could not be booked. It may have just been reserved.');
      return;
    }
    form.reset();
    setMessage('Booked. Your confirmation is ready and the course has your reservation.');
  }

  return (
    <form onSubmit={submit} className="mt-4 grid gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <input className="input" name="firstName" placeholder="First name" required />
        <input className="input" name="lastName" placeholder="Last name" required />
      </div>
      <input className="input" name="email" type="email" placeholder="Email" required />
      <input className="input" name="phone" placeholder="Phone" />
      <div className="flex items-center gap-3">
        <input className="input max-w-24" name="partySize" type="number" min="1" max={maxPartySize} defaultValue="4" required />
        <button className="btn" disabled={isSaving}>{isSaving ? 'Booking' : 'Reserve'}</button>
      </div>
      {message ? <p className="text-sm font-semibold text-emerald-700">{message}</p> : null}
    </form>
  );
}
