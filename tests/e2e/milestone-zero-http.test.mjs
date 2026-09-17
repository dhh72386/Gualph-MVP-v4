import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import test from 'node:test';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const port = 3210;
const baseUrl = `http://127.0.0.1:${port}`;
const appUrl = process.env.NEXT_PUBLIC_APP_URL;
const jwtSecret = process.env.JWT_SECRET;
let server;
let courseIds = [];
let userId;

async function waitForServer() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}/login`);
      if (response.ok) return;
    } catch {
      // The server is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error('Timed out waiting for the production server');
}

test.before(async () => {
  assert.ok(appUrl, 'NEXT_PUBLIC_APP_URL is required');
  assert.ok(jwtSecret, 'JWT_SECRET is required');
  server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '--hostname', '127.0.0.1', '--port', String(port)], {
    env: process.env,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  await waitForServer();
});

test.after(async () => {
  server?.kill('SIGTERM');
  if (courseIds.length) {
    await prisma.auditLog.deleteMany({ where: { courseId: { in: courseIds } } });
    if (userId) await prisma.user.deleteMany({ where: { id: userId } });
    await prisma.course.deleteMany({ where: { id: { in: courseIds } } });
  }
  await prisma.$disconnect();
});

test('protected API rejects unauthenticated requests', async () => {
  const response = await fetch(`${baseUrl}/api/players`);
  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), {
    ok: false,
    error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
  });
});

test('authenticated course user cannot mutate another course reservation', async () => {
  const suffix = crypto.randomUUID();
  const [owner, intruder] = await Promise.all([
    prisma.course.create({ data: { name: 'HTTP Owner', slug: `http-owner-${suffix}`, address: '1 Test Way', city: 'Test', state: 'KY', zip: '40000' } }),
    prisma.course.create({ data: { name: 'HTTP Intruder', slug: `http-intruder-${suffix}`, address: '2 Test Way', city: 'Test', state: 'KY', zip: '40000' } }),
  ]);
  courseIds = [owner.id, intruder.id];
  const user = await prisma.user.create({
    data: {
      courseId: intruder.id,
      email: `${suffix}@example.com`,
      passwordHash: 'not-used',
      firstName: 'Other',
      lastName: 'Operator',
      role: 'COURSE_ADMIN',
    },
  });
  userId = user.id;
  const player = await prisma.player.create({ data: { courseId: owner.id, firstName: 'Owner', lastName: 'Player' } });
  const teeTime = await prisma.teeTime.create({
    data: { courseId: owner.id, startTime: new Date(Date.now() + 86_400_000), playersAllowed: 4, greenFeeCents: 5000, status: 'RESERVED' },
  });
  const reservation = await prisma.reservation.create({
    data: { teeTimeId: teeTime.id, playerId: player.id, partySize: 2, totalCents: 10000, confirmationCode: crypto.randomUUID() },
  });
  const token = jwt.sign({ id: user.id, sessionVersion: user.sessionVersion }, jwtSecret, {
    algorithm: 'HS256',
    audience: 'gualph-web',
    issuer: appUrl,
    expiresIn: '8h',
  });

  const response = await fetch(`${baseUrl}/api/reservations/${reservation.id}`, {
    method: 'PATCH',
    headers: {
      'content-type': 'application/json',
      cookie: `gualph_session=${token}`,
      origin: appUrl,
    },
    body: JSON.stringify({ partySize: 3 }),
  });
  assert.equal(response.status, 404);
  assert.equal((await response.json()).error.code, 'NOT_FOUND');
  assert.equal((await prisma.reservation.findUniqueOrThrow({ where: { id: reservation.id } })).partySize, 2);
});
