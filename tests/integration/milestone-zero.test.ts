import assert from 'node:assert/strict';
import test from 'node:test';
import { Prisma, PrismaClient } from '@prisma/client';
import { resolveSession } from '../../lib/auth';
import { signSession } from '../../lib/session';
import { cancelReservation, moveReservation } from '../../lib/services/reservation-lifecycle';

const prisma = new PrismaClient();
const courseIds: string[] = [];

test.after(async () => {
  if (courseIds.length) {
    await prisma.auditLog.deleteMany({ where: { courseId: { in: courseIds } } });
    await prisma.user.deleteMany({ where: { courseId: { in: courseIds } } });
    await prisma.course.deleteMany({ where: { id: { in: courseIds } } });
  }
  await prisma.$disconnect();
});

async function createCourse(name: string) {
  const created = await prisma.course.create({ data: { name, slug: `${name.toLowerCase()}-${crypto.randomUUID()}`, address: '1 Test Way', city: 'Test', state: 'KY', zip: '40000' } });
  courseIds.push(created.id);
  return created;
}

async function createBookedReservation(name: string) {
  const course = await createCourse(name);
  const actor = await prisma.user.create({
    data: {
      courseId: course.id,
      email: `${crypto.randomUUID()}@example.com`,
      passwordHash: 'not-used',
      firstName: 'Test',
      lastName: 'Operator',
      role: 'COURSE_ADMIN',
    },
  });
  const player = await prisma.player.create({
    data: { courseId: course.id, firstName: 'Test', lastName: 'Golfer' },
  });
  const startTime = Date.now() + 259_200_000;
  const teeTimes = await Promise.all([0, 1, 2].map((offset) => prisma.teeTime.create({
    data: {
      courseId: course.id,
      startTime: new Date(startTime + offset * 900_000),
      playersAllowed: 4,
      greenFeeCents: 5000,
      status: offset === 0 ? 'RESERVED' : 'AVAILABLE',
    },
  })));
  const reservation = await prisma.reservation.create({
    data: {
      teeTimeId: teeTimes[0].id,
      playerId: player.id,
      partySize: 2,
      totalCents: 10000,
      confirmationCode: crypto.randomUUID(),
    },
  });

  return { course, actor: { id: actor.id, courseId: course.id }, teeTimes, reservation };
}

test('course-scoped resource queries reject cross-course IDs', async () => {
  const [first, second] = await Promise.all([createCourse('TenantA'), createCourse('TenantB')]);
  const player = await prisma.player.create({ data: { courseId: first.id, firstName: 'A', lastName: 'Player' } });
  assert.equal(await prisma.player.findFirst({ where: { id: player.id, courseId: second.id } }), null);
});

test('database-backed session resolution rejects revoked sessions', async () => {
  const owner = await createCourse('Sessions');
  const user = await prisma.user.create({ data: { courseId: owner.id, email: `${crypto.randomUUID()}@example.com`, passwordHash: 'not-used', firstName: 'Session', lastName: 'User', role: 'STAFF' } });
  const token = signSession(user);
  assert.equal((await resolveSession(token))?.id, user.id);
  await prisma.user.update({ where: { id: user.id }, data: { sessionVersion: { increment: 1 } } });
  assert.equal(await resolveSession(token), null);
});

test('conditional inventory claims permit only one concurrent booking', async () => {
  const owner = await createCourse('Concurrency');
  const teeTime = await prisma.teeTime.create({ data: { courseId: owner.id, startTime: new Date(Date.now() + 86_400_000), playersAllowed: 4, greenFeeCents: 5000 } });
  const players = await Promise.all(['One', 'Two'].map((lastName) => prisma.player.create({ data: { courseId: owner.id, firstName: 'Test', lastName } })));
  const reserve = (playerId: string) => prisma.$transaction(async (tx) => {
    const claim = await tx.teeTime.updateMany({ where: { id: teeTime.id, courseId: owner.id, status: 'AVAILABLE' }, data: { status: 'RESERVED' } });
    if (claim.count !== 1) throw new Error('TEE_TIME_CONFLICT');
    return tx.reservation.create({ data: { teeTimeId: teeTime.id, playerId, partySize: 2, totalCents: 10000, confirmationCode: crypto.randomUUID() } });
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  const results = await Promise.allSettled(players.map((player) => reserve(player.id)));
  assert.equal(results.filter((result) => result.status === 'fulfilled').length, 1);
  assert.equal(await prisma.reservation.count({ where: { teeTimeId: teeTime.id } }), 1);
});

test('database constraints reject invalid capacity', async () => {
  const owner = await createCourse('Constraints');
  await assert.rejects(() => prisma.teeTime.create({ data: { courseId: owner.id, startTime: new Date(Date.now() + 172_800_000), playersAllowed: 0, greenFeeCents: 5000 } }));
});

test('concurrent moves preserve one reservation and consistent inventory', async () => {
  const { course, actor, teeTimes, reservation } = await createBookedReservation('MoveRace');
  const attempts = teeTimes.slice(1).map((teeTime) => moveReservation(prisma, actor, {
    reservationId: reservation.id,
    teeTimeId: teeTime.id,
  }));
  const results = await Promise.allSettled(attempts);
  assert.ok(results.some((result) => result.status === 'fulfilled'));

  const persisted = await prisma.reservation.findUniqueOrThrow({ where: { id: reservation.id } });
  const inventory = await prisma.teeTime.findMany({
    where: { courseId: course.id },
    orderBy: { startTime: 'asc' },
  });
  assert.equal(persisted.status, 'BOOKED');
  assert.equal(inventory.filter((teeTime) => teeTime.status === 'RESERVED').length, 1);
  assert.equal(inventory.find((teeTime) => teeTime.status === 'RESERVED')?.id, persisted.teeTimeId);
  assert.equal(inventory[0].status, 'AVAILABLE');
});

test('concurrent move and cancellation preserve reservation and inventory consistency', async () => {
  const { course, actor, teeTimes, reservation } = await createBookedReservation('MoveCancelRace');
  const results = await Promise.allSettled([
    moveReservation(prisma, actor, { reservationId: reservation.id, teeTimeId: teeTimes[1].id }),
    cancelReservation(prisma, actor, reservation.id),
  ]);
  assert.ok(results.some((result) => result.status === 'fulfilled'));

  const persisted = await prisma.reservation.findUniqueOrThrow({ where: { id: reservation.id } });
  const inventory = await prisma.teeTime.findMany({ where: { courseId: course.id } });
  const reservedIds = inventory.filter((teeTime) => teeTime.status === 'RESERVED').map((teeTime) => teeTime.id);
  if (persisted.status === 'BOOKED') {
    assert.deepEqual(reservedIds, [persisted.teeTimeId]);
  } else {
    assert.equal(persisted.status, 'CANCELLED');
    assert.deepEqual(reservedIds, []);
  }
});
