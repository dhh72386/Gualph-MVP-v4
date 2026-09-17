import { TeeTimeStatus } from '@prisma/client';
import { z } from 'zod';
import { apiCreated, apiOk, handleApiError, parseJson } from '@/lib/api';
import { RequestError } from '@/lib/errors';
import { prisma } from '@/lib/prisma';
import { requireCoursePermission } from '@/lib/auth';
import { assertTeeTimeCanBeBooked, calculateReservationTotal, confirmationCode } from '@/lib/services/reservations';
import { assertTrustedOrigin } from '@/lib/security';

export const dynamic = 'force-dynamic';

const reservationSchema = z.object({
  teeTimeId: z.string().min(1),
  playerId: z.string().min(1),
  partySize: z.coerce.number().int().min(1).max(8),
});

export async function GET() {
  try {
    const user = await requireCoursePermission('reservation:read');
    const reservations = await prisma.reservation.findMany({
      where: { teeTime: { courseId: user.courseId } },
      include: { teeTime: true, player: true },
      orderBy: { createdAt: 'desc' },
    });
    return apiOk(reservations);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: Request) {
  try {
    assertTrustedOrigin(req);
    const user = await requireCoursePermission('reservation:write');
    const body = reservationSchema.parse(await parseJson(req));

    const reservation = await prisma.$transaction(async (tx) => {
      const [teeTime, player] = await Promise.all([
        tx.teeTime.findFirst({
          where: { id: body.teeTimeId, courseId: user.courseId },
          include: { reservation: true },
        }),
        tx.player.findFirst({ where: { id: body.playerId, courseId: user.courseId } }),
      ]);

      if (!teeTime) throw new RequestError('Tee time was not found for this course', undefined, 404, 'NOT_FOUND');
      if (!player) throw new RequestError('Player was not found for this course', undefined, 404, 'NOT_FOUND');
      assertTeeTimeCanBeBooked(teeTime, body.partySize, 'Tee time was not found for this course');

      const claimed = await tx.teeTime.updateMany({
        where: { id: body.teeTimeId, courseId: user.courseId, status: TeeTimeStatus.AVAILABLE },
        data: { status: TeeTimeStatus.RESERVED },
      });
      if (claimed.count !== 1) throw new RequestError('Tee time is no longer available', undefined, 409, 'TEE_TIME_CONFLICT');

      const created = await tx.reservation.create({
        data: {
          teeTimeId: body.teeTimeId,
          playerId: body.playerId,
          partySize: body.partySize,
          totalCents: calculateReservationTotal(teeTime, body.partySize),
          confirmationCode: confirmationCode(),
        },
      });

      return created;
    }, { isolationLevel: 'Serializable' });

    return apiCreated(reservation);
  } catch (error) {
    return handleApiError(error);
  }
}
