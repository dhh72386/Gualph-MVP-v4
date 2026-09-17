import type { ReservationStatus, TeeTimeStatus } from '@prisma/client';
import { RequestError } from '../errors';
import { priceWithFees } from './pricing';

type BookableTeeTime = {
  id: string;
  status: TeeTimeStatus;
  playersAllowed: number;
  greenFeeCents: number;
  cartFeeCents: number;
  reservation?: unknown | null;
};

type ReservationLifecycleState = {
  status: ReservationStatus;
  teeTime: { id: string };
};

export function confirmationCode() {
  return `GUALPH-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
}

export function assertTeeTimeCanBeBooked(teeTime: BookableTeeTime | null, partySize: number, missingMessage = 'Tee time was not found'): asserts teeTime is BookableTeeTime {
  if (!teeTime) throw new RequestError(missingMessage, undefined, 404, 'NOT_FOUND');
  if (teeTime.status !== 'AVAILABLE' || teeTime.reservation) throw new RequestError('Tee time is not available for booking');
  if (partySize > teeTime.playersAllowed) throw new RequestError('Party size exceeds tee time capacity');
}

export function calculateReservationTotal(teeTime: Pick<BookableTeeTime, 'greenFeeCents' | 'cartFeeCents'>, partySize: number) {
  return priceWithFees(teeTime.greenFeeCents, teeTime.cartFeeCents, partySize);
}

export function assertReservationCanBeCancelled(reservation: ReservationLifecycleState | null): asserts reservation is ReservationLifecycleState {
  if (!reservation) throw new RequestError('Reservation was not found for this course', undefined, 404, 'NOT_FOUND');
  if (reservation.status === 'CANCELLED') throw new RequestError('Reservation is already cancelled');
  if (reservation.status === 'NO_SHOW') throw new RequestError('No-show reservations cannot be cancelled');
  if (reservation.status === 'CHECKED_IN') throw new RequestError('Checked-in reservations cannot be cancelled');
}

export function assertReservationCanMove(reservation: ReservationLifecycleState | null): asserts reservation is ReservationLifecycleState {
  if (!reservation) throw new RequestError('Reservation was not found for this course', undefined, 404, 'NOT_FOUND');
  if (reservation.status !== 'BOOKED') throw new RequestError('Only booked reservations can be modified');
}
