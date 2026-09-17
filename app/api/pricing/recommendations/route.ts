import { apiOk, handleApiError } from '@/lib/api';
import { requireCoursePermission } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getCourseAnalytics } from '@/lib/services/analytics';
import { recommendTeeTimePrice } from '@/lib/services/pricing';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await requireCoursePermission('pricing:read');
    const [analytics, teeTimes] = await Promise.all([
      getCourseAnalytics(user.courseId),
      prisma.teeTime.findMany({
        where: { courseId: user.courseId, status: 'AVAILABLE', startTime: { gte: new Date() } },
        orderBy: { startTime: 'asc' },
        take: 100,
      }),
    ]);

    return apiOk(teeTimes.map((teeTime) => recommendTeeTimePrice(teeTime, analytics.occupancyRate)));
  } catch (error) {
    return handleApiError(error);
  }
}
