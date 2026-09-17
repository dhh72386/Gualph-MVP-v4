'use client';

import { XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function ReservationActions({ reservationId, status }: { reservationId: string; status: string }) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const canCancel = status === 'BOOKED';

  async function cancelReservation() {
    setIsSaving(true);
    await fetch(`/api/reservations/${reservationId}`, { method: 'DELETE' });
    setIsSaving(false);
    router.refresh();
  }

  return (
    <button className="btn-secondary gap-2" onClick={cancelReservation} disabled={!canCancel || isSaving} title="Cancel reservation">
      <XCircle className="h-4 w-4" aria-hidden="true" />
      {isSaving ? 'Cancelling' : 'Cancel'}
    </button>
  );
}
