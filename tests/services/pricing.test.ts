import assert from 'node:assert/strict';
import test from 'node:test';
import type { TeeTime } from '@prisma/client';
import { priceWithFees, recommendTeeTimePrice } from '../../lib/services/pricing';

function teeTime(overrides: Partial<TeeTime>): TeeTime {
  return {
    id: 'tee-time-1',
    courseId: 'course-1',
    startTime: new Date('2026-07-04T09:00:00'),
    playersAllowed: 4,
    greenFeeCents: 5000,
    cartFeeCents: 1800,
    status: 'AVAILABLE',
    notes: null,
    createdAt: new Date('2026-06-27T00:00:00.000Z'),
    updatedAt: new Date('2026-06-27T00:00:00.000Z'),
    ...overrides,
  };
}

test('priceWithFees multiplies green and cart fees by party size', () => {
  assert.equal(priceWithFees(4500, 1800, 4), 25200);
});

test('recommendTeeTimePrice raises prime weekend pricing under high occupancy', () => {
  const recommendation = recommendTeeTimePrice(teeTime({}), 0.82);
  assert.equal(recommendation.adjustmentPercent, 30);
  assert.equal(recommendation.recommendedGreenFeeCents, 6500);
  assert.match(recommendation.reason, /weekend demand/);
  assert.match(recommendation.reason, /prime morning slot/);
});

test('recommendTeeTimePrice discounts late-day low-occupancy inventory but keeps minimum price', () => {
  const recommendation = recommendTeeTimePrice(teeTime({ startTime: new Date('2026-07-01T16:00:00'), greenFeeCents: 1600 }), 0.2);
  assert.equal(recommendation.adjustmentPercent, -18);
  assert.equal(recommendation.recommendedGreenFeeCents, 1500);
});
