import { Prisma, ReservationStatus, TeeTimeStatus, type PrismaClient } from '@prisma/client';
import { RequestError } from '../errors';
import {
  assertReservationCanBeCancelled,
  assertReservationCanMove,
  assertTeeTimeCanBeBooked,
  calculateReservationTotal,
} from './reservations';

type TransactionClient = Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>;

type ReservationActor = {
  id: string;
  courseId: string;
};

type MoveReservationInput = {
  reservationId: string;
  teeTimeId?: string;
  partySize?: number;
};

export function moveReservation(
  prisma: PrismaClient,
  actor: ReservationActor,
  input: MoveReservationInput,
) {
  return prisma.$transaction(
    async (tx) => moveReservationTransaction(tx, actor, input),
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
}

export function cancelReservation(
  prisma: PrismaClient,
  actor: ReservationActor,
  reservationId: string,
) {
  return prisma.$transaction(
    async (tx) => cancelReservationTransaction(tx, actor, reservationId),
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
}

async function moveReservationTransaction(
  tx: TransactionClient,
  actor: ReservationActor,
  input: MoveReservationInput,
) {
  const existing = await tx.reservation.findFirst({
    where: { id: input.reservationId, teeTime: { courseId: actor.courseId } },
    include: { teeTime: true },
  });
  assertReservationCanMove(existing);

  const targetTeeTimeId = input.teeTimeId ?? existing.teeTimeId;
  const partySize = input.partySize ?? existing.partySize;
  const isMoving = targetTeeTimeId !== existing.teeTimeId;
  const targetTeeTime = isMoving
    ? await tx.teeTime.findFirst({
        where: { id: targetTeeTimeId, courseId: actor.courseId },
        include: { reservation: true },
      })
    : existing.teeTime;

  if (isMoving) {
    assertTeeTimeCanBeBooked(targetTeeTime, partySize, 'Target tee time was not found for this course');
  } else if (partySize > existing.teeTime.playersAllowed) {
    throw new RequestError('Party size exceeds tee time capacity');
  }
  if (!targetTeeTime) throw new RequestError('Target tee time was not found for this course');

  if (isMoving) {
    const claimed = await tx.teeTime.updateMany({
      where: { id: targetTeeTimeId, courseId: actor.courseId, status: TeeTimeStatus.AVAILABLE },
      data: { status: TeeTimeStatus.RESERVED },
    });
    if (claimed.count !== 1) {
      throw new RequestError('Target tee time is no longer available', undefined, 409, 'TEE_TIME_CONFLICT');
    }
  }

  const changed = await tx.reservation.updateMany({
    where: { id: existing.id, teeTimeId: existing.teeTimeId, status: ReservationStatus.BOOKED },
    data: {
      teeTimeId: targetTeeTimeId,
      partySize,
      totalCents: calculateReservationTotal(targetTeeTime, partySize),
    },
  });
  if (changed.count !== 1) {
    throw new RequestError('Reservation changed during this request', undefined, 409, 'RESERVATION_CONFLICT');
  }

  if (isMoving) {
    await tx.teeTime.update({ where: { id: existing.teeTimeId }, data: { status: TeeTimeStatus.AVAILABLE } });
  }

  const updated = await tx.reservation.findUniqueOrThrow({
    where: { id: existing.id },
    include: { teeTime: true, player: true },
  });
  await tx.auditLog.create({
    data: {
      courseId: actor.courseId,
      actorId: actor.id,
      action: 'UPDATE',
      entity: 'Reservation',
      entityId: updated.id,
      metadata: {
        previousTeeTimeId: existing.teeTimeId,
        nextTeeTimeId: targetTeeTimeId,
        partySize,
      },
    },
  });

  return updated;
}

async function cancelReservationTransaction(
  tx: TransactionClient,
  actor: ReservationActor,
  reservationId: string,
) {
  const existing = await tx.reservation.findFirst({
    where: { id: reservationId, teeTime: { courseId: actor.courseId } },
    include: { teeTime: true, player: true },
  });
  assertReservationCanBeCancelled(existing);

  const cancelled = await tx.reservation.updateMany({
    where: { id: existing.id, teeTimeId: existing.teeTimeId, status: ReservationStatus.BOOKED },
    data: { status: ReservationStatus.CANCELLED },
  });
  if (cancelled.count !== 1) {
    throw new RequestError('Reservation changed during this request', undefined, 409, 'RESERVATION_CONFLICT');
  }

  const updated = await tx.reservation.findUniqueOrThrow({
    where: { id: existing.id },
    include: { teeTime: true, player: true },
  });
  await Promise.all([
    tx.teeTime.update({ where: { id: existing.teeTimeId }, data: { status: TeeTimeStatus.AVAILABLE } }),
    tx.auditLog.create({
      data: {
        courseId: actor.courseId,
        actorId: actor.id,
        action: 'UPDATE',
        entity: 'Reservation',
        entityId: updated.id,
        metadata: { status: ReservationStatus.CANCELLED, teeTimeId: existing.teeTimeId },
      },
    }),
  ]);

  return updated;
}
