import assert from 'node:assert/strict';
import test from 'node:test';
import type { TeeTime, TeeTimeStatus } from '@prisma/client';
import { generateTeeSheetSuggestions } from '../../lib/services/optimization';

function teeTime(index: number, status: TeeTimeStatus): TeeTime {
  return {
    id: `tee-time-${index}`,
    courseId: 'course-1',
    startTime: new Date(Date.UTC(2026, 6, 1, 8, index * 10)),
    playersAllowed: 4,
    greenFeeCents: 5000,
    cartFeeCents: 1800,
    status,
    notes: null,
    createdAt: new Date('2026-06-27T00:00:00.000Z'),
    updatedAt: new Date('2026-06-27T00:00:00.000Z'),
  };
}

test('generateTeeSheetSuggestions flags low occupancy', () => {
  const suggestions = generateTeeSheetSuggestions([
    teeTime(0, 'AVAILABLE'),
    teeTime(1, 'AVAILABLE'),
    teeTime(2, 'RESERVED'),
    teeTime(3, 'AVAILABLE'),
  ]);

  assert.equal(suggestions[0].title, 'Compress low-demand windows');
  assert.equal(suggestions[0].impact, 'HIGH');
});

test('generateTeeSheetSuggestions finds single-slot gaps', () => {
  const suggestions = generateTeeSheetSuggestions([
    teeTime(0, 'RESERVED'),
    teeTime(1, 'AVAILABLE'),
    teeTime(2, 'RESERVED'),
  ]);

  assert.ok(suggestions.some((suggestion) => suggestion.title === 'Fill single-slot gaps'));
});
