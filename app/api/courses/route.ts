import { z } from 'zod';
import { apiOk, handleApiError, parseJson } from '@/lib/api';
import { requireCoursePermission } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { assertTrustedOrigin } from '@/lib/security';

export const dynamic = 'force-dynamic';

const courseSchema = z.object({
  name: z.string().trim().min(2).max(160),
  description: z.string().trim().max(1000).optional().or(z.literal('')),
  address: z.string().trim().max(200).optional().or(z.literal('')),
  city: z.string().trim().min(1).max(120),
  state: z.string().trim().min(2).max(80),
  zip: z.string().trim().min(3).max(20),
  phone: z.string().trim().max(30).optional().or(z.literal('')),
  email: z.string().email().optional().or(z.literal('')),
  website: z.string().url().optional().or(z.literal('')),
  holes: z.coerce.number().int().min(1).max(72),
  timezone: z.string().trim().min(1).max(80),
  amenities: z.array(z.string().trim().min(1).max(80)).max(40).default([]),
});

export async function GET() {
  try {
    const user = await requireCoursePermission('course:read');
    return apiOk(await prisma.course.findUniqueOrThrow({ where: { id: user.courseId } }));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: Request) {
  try {
    assertTrustedOrigin(req);
    const user = await requireCoursePermission('course:update');
    const body = courseSchema.parse(await parseJson(req));
    const course = await prisma.course.update({
      where: { id: user.courseId },
      data: {
        ...body,
        description: body.description || null,
        address: body.address || '',
        phone: body.phone || null,
        email: body.email || null,
        website: body.website || null,
      },
    });
    return apiOk(course);
  } catch (error) {
    return handleApiError(error);
  }
}
