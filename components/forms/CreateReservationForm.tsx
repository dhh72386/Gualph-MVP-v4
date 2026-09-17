'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

type Option = { id: string; label: string };

export function CreateReservationForm({ teeTimes, players }: { teeTimes: Option[]; players: Option[] }) {
  const router = useRouter();
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setIsSaving(true);
    const form = event.currentTarget;
    const body = Object.fromEntries(new FormData(form).entries());
    const response = await fetch('/api/reservations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    setIsSaving(false);
    if (!response.ok) {
      setError('Reservation could not be created. Confirm the slot is available and capacity is valid.');
      return;
    }
    form.reset();
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="card">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="eyebrow">Bookings</p>
          <h2 className="text-lg font-bold">Create reservation</h2>
        </div>
        <button className="btn" disabled={isSaving || !teeTimes.length || !players.length}>{isSaving ? 'Booking' : 'Book'}</button>
      </div>
      {error ? <p className="mt-3 text-sm font-semibold text-red-600">{error}</p> : null}
      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        <label className="label">Tee time<select className="input mt-1" name="teeTimeId" required>{teeTimes.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}</select></label>
        <label className="label">Player<select className="input mt-1" name="playerId" required>{players.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}</select></label>
        <label className="label">Party size<input className="input mt-1" name="partySize" type="number" min="1" max="8" defaultValue="4" required /></label>
      </div>
      {!teeTimes.length || !players.length ? <p className="mt-3 text-sm text-slate-500">Create at least one available tee time and player before booking.</p> : null}
    </form>
  );
}
