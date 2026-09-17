import { apiOk, handleApiError } from '@/lib/api';
import { requireCoursePermission } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateTeeSheetSuggestions } from '@/lib/services/optimization';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await requireCoursePermission('optimization:read');
    const teeTimes = await prisma.teeTime.findMany({
      where: { courseId: user.courseId, startTime: { gte: new Date() } },
      orderBy: { startTime: 'asc' },
      take: 160,
    });
    return apiOk(generateTeeSheetSuggestions(teeTimes));
  } catch (error) {
    return handleApiError(error);
  }
}
