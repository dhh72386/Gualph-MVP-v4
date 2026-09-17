import assert from 'node:assert/strict';
import test from 'node:test';
import { assertTrustedOrigin } from '../../lib/security';

Object.assign(process.env, {
  NODE_ENV: 'test',
  DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/gualph_test',
  JWT_SECRET: 'test-security-secret-with-at-least-32-characters',
  NEXT_PUBLIC_APP_URL: 'https://app.gualph.test',
});

test('trusted origin validation permits same-origin mutations', () => {
  assert.doesNotThrow(() => assertTrustedOrigin(new Request('https://app.gualph.test/api/test', { method: 'POST', headers: { origin: 'https://app.gualph.test' } })));
});

test('trusted origin validation rejects cross-origin mutations', () => {
  assert.throws(() => assertTrustedOrigin(new Request('https://app.gualph.test/api/test', { method: 'POST', headers: { origin: 'https://attacker.test' } })), /not allowed/);
});
