import { apiOk, handleApiError } from '@/lib/api';
import { requireCoursePermission } from '@/lib/auth';
import { getCourseAnalytics } from '@/lib/services/analytics';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await requireCoursePermission('report:read');
    return apiOk(await getCourseAnalytics(user.courseId));
  } catch (error) {
    return handleApiError(error);
  }
}
