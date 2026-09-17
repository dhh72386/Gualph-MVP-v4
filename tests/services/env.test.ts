import assert from 'node:assert/strict';
import test from 'node:test';
import { parseServerEnv } from '../../lib/env';

const valid = {
  NODE_ENV: 'test',
  DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/gualph_test',
  JWT_SECRET: 'a-secure-test-secret-with-32-characters',
  NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
};

test('parseServerEnv accepts complete secure configuration', () => {
  assert.equal(parseServerEnv(valid).NODE_ENV, 'test');
});

test('parseServerEnv rejects missing and weak secrets', () => {
  assert.throws(() => parseServerEnv({ ...valid, JWT_SECRET: 'dev-secret' }));
  assert.throws(() => parseServerEnv({ ...valid, DATABASE_URL: undefined }));
});
