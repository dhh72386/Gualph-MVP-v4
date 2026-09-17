import assert from 'node:assert/strict';
import test from 'node:test';
import { toCsv } from '../../lib/services/csv';

test('toCsv escapes commas, quotes, and newlines', () => {
  const csv = toCsv([{ name: 'Smith, Jane', note: 'Needs "early" slot\nPrefers cart', rounds: 4 }]);
  assert.equal(csv, 'name,note,rounds\n"Smith, Jane","Needs ""early"" slot\nPrefers cart",4');
});

test('toCsv returns an empty string for empty exports', () => {
  assert.equal(toCsv([]), '');
});
