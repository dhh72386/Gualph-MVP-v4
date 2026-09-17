import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { SESSION_COOKIE, sessionCookieOptions, signSession } from '@/lib/auth';
import { apiError, apiOk, handleApiError, parseJson } from '@/lib/api';
import { assertTrustedOrigin } from '@/lib/security';

const loginSchema = z.object({
  email: z.string().email().transform((value) => value.toLowerCase()),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    assertTrustedOrigin(req);
    const { email, password } = loginSchema.parse(await parseJson(req));
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return apiError('INVALID_CREDENTIALS', 'Invalid email or password', 401);
    }

    const token = signSession({ id: user.id, email: user.email, role: user.role, courseId: user.courseId, sessionVersion: user.sessionVersion });
    const res = apiOk({ user: { id: user.id, email: user.email, role: user.role, courseId: user.courseId } });
    res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
    await prisma.auditLog.create({ data: { courseId: user.courseId, actorId: user.id, action: 'LOGIN', entity: 'User', entityId: user.id } });
    return res;
  } catch (error) {
    return handleApiError(error);
  }
}
