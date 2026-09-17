import assert from 'node:assert/strict';
import test from 'node:test';
import { RequestError } from '../../lib/errors';
import {
  assertReservationCanBeCancelled,
  assertReservationCanMove,
  assertTeeTimeCanBeBooked,
  calculateReservationTotal,
} from '../../lib/services/reservations';

test('assertTeeTimeCanBeBooked accepts available inventory within capacity', () => {
  assert.doesNotThrow(() => assertTeeTimeCanBeBooked({
    id: 'tee-time-1',
    status: 'AVAILABLE',
    playersAllowed: 4,
    greenFeeCents: 4500,
    cartFeeCents: 1800,
    reservation: null,
  }, 4));
});

test('assertTeeTimeCanBeBooked rejects reserved inventory', () => {
  assert.throws(() => assertTeeTimeCanBeBooked({
    id: 'tee-time-1',
    status: 'RESERVED',
    playersAllowed: 4,
    greenFeeCents: 4500,
    cartFeeCents: 1800,
    reservation: null,
  }, 2), RequestError);
});

test('assertTeeTimeCanBeBooked rejects oversized parties', () => {
  assert.throws(() => assertTeeTimeCanBeBooked({
    id: 'tee-time-1',
    status: 'AVAILABLE',
    playersAllowed: 2,
    greenFeeCents: 4500,
    cartFeeCents: 1800,
    reservation: null,
  }, 3), /capacity/);
});

test('assertTeeTimeCanBeBooked returns a stable not-found error for missing inventory', () => {
  assert.throws(
    () => assertTeeTimeCanBeBooked(null, 2),
    (error: unknown) => error instanceof RequestError && error.status === 404 && error.code === 'NOT_FOUND',
  );
});

test('calculateReservationTotal uses green fee and cart fee', () => {
  assert.equal(calculateReservationTotal({ greenFeeCents: 4500, cartFeeCents: 1800 }, 4), 25200);
});

test('assertReservationCanBeCancelled only permits booked reservations', () => {
  assert.doesNotThrow(() => assertReservationCanBeCancelled({ status: 'BOOKED', teeTime: { id: 'tee-time-1' } }));
  assert.throws(() => assertReservationCanBeCancelled({ status: 'CHECKED_IN', teeTime: { id: 'tee-time-1' } }), /Checked-in/);
  assert.throws(() => assertReservationCanBeCancelled({ status: 'CANCELLED', teeTime: { id: 'tee-time-1' } }), /already/);
});

test('assertReservationCanMove only permits booked reservations', () => {
  assert.doesNotThrow(() => assertReservationCanMove({ status: 'BOOKED', teeTime: { id: 'tee-time-1' } }));
  assert.throws(() => assertReservationCanMove({ status: 'CANCELLED', teeTime: { id: 'tee-time-1' } }), /Only booked/);
});

test('reservation lifecycle guards return stable not-found errors', () => {
  for (const operation of [assertReservationCanMove, assertReservationCanBeCancelled]) {
    assert.throws(
      () => operation(null),
      (error: unknown) => error instanceof RequestError && error.status === 404 && error.code === 'NOT_FOUND',
    );
  }
});
