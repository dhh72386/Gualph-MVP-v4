import { apiOk, handleApiError } from '@/lib/api';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
const paramsSchema = z.object({ slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(160) });

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = paramsSchema.parse(await params);
    const course = await prisma.course.findUniqueOrThrow({
      where: { slug },
      include: {
        operatingHours: { orderBy: { dayOfWeek: 'asc' } },
        photos: { orderBy: { sortOrder: 'asc' } },
        teeTimes: {
          where: { status: 'AVAILABLE', startTime: { gte: new Date() } },
          orderBy: { startTime: 'asc' },
          take: 60,
        },
      },
    });
    return apiOk(course);
  } catch (error) {
    return handleApiError(error);
  }
}
