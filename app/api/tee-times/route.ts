import { TeeTimeStatus } from '@prisma/client';
import { z } from 'zod';
import { apiCreated, apiOk, handleApiError, parseJson } from '@/lib/api';
import { prisma } from '@/lib/prisma';
import { requireCoursePermission } from '@/lib/auth';
import { assertTrustedOrigin } from '@/lib/security';

export const dynamic = 'force-dynamic';

const querySchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  limit: z.coerce.number().int().min(1).max(500).default(100),
});

const teeTimeSchema = z.object({
  startTime: z.string().datetime(),
  playersAllowed: z.coerce.number().int().min(1).max(8).default(4),
  greenFee: z.coerce.number().min(0).max(10000),
  cartFee: z.coerce.number().min(0).max(10000).default(0),
  status: z.nativeEnum(TeeTimeStatus).default(TeeTimeStatus.AVAILABLE),
  notes: z.string().trim().max(1000).optional(),
});

export async function GET(req: Request) {
  try {
    const user = await requireCoursePermission('tee-time:read');
    const { searchParams } = new URL(req.url);
    const query = querySchema.parse(Object.fromEntries(searchParams.entries()));
    const startTime = {
      ...(query.from ? { gte: new Date(query.from) } : {}),
      ...(query.to ? { lte: new Date(query.to) } : {}),
    };

    const teeTimes = await prisma.teeTime.findMany({
      where: { courseId: user.courseId, ...(query.from || query.to ? { startTime } : {}) },
      orderBy: { startTime: 'asc' },
      take: query.limit,
      include: { reservation: { include: { player: true } } },
    });

    return apiOk(teeTimes);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: Request) {
  try {
    assertTrustedOrigin(req);
    const user = await requireCoursePermission('tee-time:write');
    const body = teeTimeSchema.parse(await parseJson(req));
    const teeTime = await prisma.teeTime.create({
      data: {
        courseId: user.courseId,
        startTime: new Date(body.startTime),
        playersAllowed: body.playersAllowed,
        greenFeeCents: Math.round(body.greenFee * 100),
        cartFeeCents: Math.round(body.cartFee * 100),
        status: body.status,
        notes: body.notes,
      },
    });

    return apiCreated(teeTime);
  } catch (error) {
    return handleApiError(error);
  }
}
