import { z } from 'zod';
import { apiCreated, apiOk, handleApiError, parseJson } from '@/lib/api';
import { prisma } from '@/lib/prisma';
import { requireCoursePermission } from '@/lib/auth';
import { assertTrustedOrigin } from '@/lib/security';

export const dynamic = 'force-dynamic';

const playerSchema = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  email: z.string().email().transform((value) => value.toLowerCase()).optional().or(z.literal('')),
  phone: z.string().trim().min(7).max(30).optional().or(z.literal('')),
});

export async function GET() {
  try {
    const user = await requireCoursePermission('player:read');
    const players = await prisma.player.findMany({
      where: { courseId: user.courseId },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    });
    return apiOk(players);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: Request) {
  try {
    assertTrustedOrigin(req);
    const user = await requireCoursePermission('player:write');
    const body = playerSchema.parse(await parseJson(req));
    const player = await prisma.player.create({
      data: {
        courseId: user.courseId,
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email || null,
        phone: body.phone || null,
      },
    });
    return apiCreated(player);
  } catch (error) {
    return handleApiError(error);
  }
}
