import assert from 'node:assert/strict';
import test from 'node:test';
import jwt from 'jsonwebtoken';
import { sessionCookieOptions, signSession } from '../../lib/session';

const jwtSecret = 'test-session-secret-with-at-least-32-characters';
Object.assign(process.env, {
  NODE_ENV: 'test',
  DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/gualph_test',
  JWT_SECRET: jwtSecret,
  NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
});

test('session cookies are http-only, same-site, and limited to eight hours', () => {
  const options = sessionCookieOptions();
  assert.equal(options.httpOnly, true);
  assert.equal(options.sameSite, 'lax');
  assert.equal(options.maxAge, 60 * 60 * 8);
});

test('session tokens contain only the revocable identity claims', () => {
  const token = signSession({ id: 'user-1', email: 'user@example.com', role: 'STAFF', courseId: 'course-1', sessionVersion: 3 });
  const payload = jwt.verify(token, jwtSecret) as jwt.JwtPayload;
  assert.equal(payload.id, 'user-1');
  assert.equal(payload.sessionVersion, 3);
  assert.equal(payload.email, undefined);
  assert.equal(payload.role, undefined);
  assert.equal(payload.courseId, undefined);
  assert.equal(payload.aud, 'gualph-web');
  assert.equal(payload.iss, 'http://localhost:3000');
  assert.equal(jwt.decode(token, { complete: true })?.header.alg, 'HS256');
});
