import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { SESSION_COOKIE, sessionCookieOptions, signSession } from '@/lib/auth';
import { apiCreated, handleApiError, parseJson } from '@/lib/api';
import { z } from 'zod';
import { assertTrustedOrigin } from '@/lib/security';

const schema = z.object({
  email: z.string().email().transform((value) => value.toLowerCase()),
  password: z.string().min(8),
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  courseName: z.string().trim().min(2).max(160),
  city: z.string().trim().min(1).max(120),
  state: z.string().trim().min(2).max(80),
  zip: z.string().trim().min(3).max(20),
});

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export async function POST(req: Request) {
  try {
    assertTrustedOrigin(req);
    const data = schema.parse(await parseJson(req));
    const passwordHash = await bcrypt.hash(data.password, 12);
    const slug = `${slugify(data.courseName)}-${crypto.randomUUID().slice(0, 8)}`;

    const { user } = await prisma.$transaction(async (tx) => {
      const course = await tx.course.create({
        data: {
          name: data.courseName,
          slug,
          address: '',
          city: data.city,
          state: data.state,
          zip: data.zip,
        },
      });
      const createdUser = await tx.user.create({
        data: {
          email: data.email,
          passwordHash,
          firstName: data.firstName,
          lastName: data.lastName,
          role: 'COURSE_ADMIN',
          courseId: course.id,
        },
      });
      return { course, user: createdUser };
    });

    const res = apiCreated({ user: { id: user.id, email: user.email, role: user.role, courseId: user.courseId } });
    res.cookies.set(SESSION_COOKIE, signSession({ id: user.id, email: user.email, role: user.role, courseId: user.courseId, sessionVersion: user.sessionVersion }), sessionCookieOptions());
    return res;
  } catch (error) {
    return handleApiError(error);
  }
}
