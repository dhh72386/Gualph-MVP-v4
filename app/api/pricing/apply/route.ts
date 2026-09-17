import { z } from 'zod';
import { apiOk, handleApiError, parseJson } from '@/lib/api';
import { requireCoursePermission } from '@/lib/auth';
import { RequestError } from '@/lib/errors';
import { prisma } from '@/lib/prisma';
import { getCourseAnalytics } from '@/lib/services/analytics';
import { recommendTeeTimePrice } from '@/lib/services/pricing';
import { assertTrustedOrigin } from '@/lib/security';

const schema = z.object({ teeTimeId: z.string().min(1) });

export async function POST(req: Request) {
  try {
    assertTrustedOrigin(req);
    const user = await requireCoursePermission('pricing:approve');
    const { teeTimeId } = schema.parse(await parseJson(req));
    const [analytics, teeTime] = await Promise.all([
      getCourseAnalytics(user.courseId),
      prisma.teeTime.findFirst({ where: { id: teeTimeId, courseId: user.courseId } }),
    ]);
    if (!teeTime) throw new RequestError('Tee time was not found for this course');

    const recommendation = recommendTeeTimePrice(teeTime, analytics.occupancyRate);
    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.teeTime.update({ where: { id: teeTime.id }, data: { greenFeeCents: recommendation.recommendedGreenFeeCents } });
      await tx.auditLog.create({ data: { courseId: user.courseId, actorId: user.id, action: 'UPDATE', entity: 'TeeTimePrice', entityId: teeTime.id, metadata: { originalPrice: recommendation.currentGreenFeeCents, recommendedPrice: recommendation.recommendedGreenFeeCents, finalAppliedPrice: recommendation.recommendedGreenFeeCents, reason: recommendation.reason, dataInputs: { occupancyRate: analytics.occupancyRate, startTime: teeTime.startTime.toISOString() }, approvedAt: new Date().toISOString() } } });
      return result;
    });

    return apiOk({ teeTime: updated, recommendation });
  } catch (error) {
    return handleApiError(error);
  }
}
