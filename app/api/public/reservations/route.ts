import { TeeTimeStatus } from '@prisma/client';
import { z } from 'zod';
import { apiCreated, handleApiError, parseJson } from '@/lib/api';
import { RequestError } from '@/lib/errors';
import { prisma } from '@/lib/prisma';
import { assertTeeTimeCanBeBooked, calculateReservationTotal, confirmationCode } from '@/lib/services/reservations';
import { assertTrustedOrigin } from '@/lib/security';

const publicReservationSchema = z.object({
  teeTimeId: z.string().min(1),
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  email: z.string().email().transform((value) => value.toLowerCase()),
  phone: z.string().trim().min(7).max(30).optional().or(z.literal('')),
  partySize: z.coerce.number().int().min(1).max(8),
});

export async function POST(req: Request) {
  try {
    assertTrustedOrigin(req);
    const body = publicReservationSchema.parse(await parseJson(req));
    const reservation = await prisma.$transaction(async (tx) => {
      const teeTime = await tx.teeTime.findUnique({ where: { id: body.teeTimeId }, include: { reservation: true } });
      try {
        assertTeeTimeCanBeBooked(teeTime, body.partySize);
      } catch (error) {
        if (error instanceof RequestError && error.message === 'Tee time is not available for booking') {
          throw new RequestError('Tee time is no longer available');
        }
        throw error;
      }

      const claimed = await tx.teeTime.updateMany({
        where: { id: teeTime.id, status: TeeTimeStatus.AVAILABLE },
        data: { status: TeeTimeStatus.RESERVED },
      });
      if (claimed.count !== 1) throw new RequestError('Tee time is no longer available', undefined, 409, 'TEE_TIME_CONFLICT');

      const existingPlayer = await tx.player.findFirst({ where: { courseId: teeTime.courseId, email: body.email } });
      const player = existingPlayer ?? await tx.player.create({
        data: {
          courseId: teeTime.courseId,
          firstName: body.firstName,
          lastName: body.lastName,
          email: body.email,
          phone: body.phone || null,
          loyaltyPoints: body.partySize * 10,
        },
      });

      const created = await tx.reservation.create({
        data: {
          teeTimeId: teeTime.id,
          playerId: player.id,
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
