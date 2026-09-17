import { z } from 'zod';
import { apiOk, handleApiError, parseJson } from '@/lib/api';
import { RequestError } from '@/lib/errors';
import { requireCoursePermission } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { cancelReservation, moveReservation } from '@/lib/services/reservation-lifecycle';
import { assertTrustedOrigin } from '@/lib/security';

export const dynamic = 'force-dynamic';

const updateSchema = z.object({
  teeTimeId: z.string().min(1).optional(),
  partySize: z.coerce.number().int().min(1).max(8).optional(),
});
const paramsSchema = z.object({ id: z.string().min(1).max(128) });

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertTrustedOrigin(req);
    const user = await requireCoursePermission('reservation:write');
    const { id } = paramsSchema.parse(await params);
    const body = updateSchema.parse(await parseJson(req));

    if (!body.teeTimeId && !body.partySize) {
      throw new RequestError('No reservation changes were provided');
    }

    const reservation = await moveReservation(prisma, user, {
      reservationId: id,
      teeTimeId: body.teeTimeId,
      partySize: body.partySize,
    });

    return apiOk(reservation);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertTrustedOrigin(req);
    const user = await requireCoursePermission('reservation:write');
    const { id } = paramsSchema.parse(await params);

    const reservation = await cancelReservation(prisma, user, id);

    return apiOk(reservation);
  } catch (error) {
    return handleApiError(error);
  }
}
