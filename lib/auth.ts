import type { UserRole } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { prisma } from './prisma';
import { serverEnv } from './env';
import { hasPermission, type Permission } from './permissions';
import { SESSION_COOKIE } from './auth-constants';
import { sessionCookieOptions, signSession, type SessionUser } from './session';

export { SESSION_COOKIE };
export { sessionCookieOptions, signSession };
export type { SessionUser };

export class AuthError extends Error {
  constructor(
    message: string,
    public readonly status = 401,
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

const sessionSchema = z.object({
  id: z.string().min(1),
  sessionVersion: z.number().int().nonnegative(),
});

export async function currentUser(): Promise<SessionUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;

  return resolveSession(token);
}

export async function resolveSession(token: string): Promise<SessionUser | null> {
  let session: z.infer<typeof sessionSchema>;
  try {
    const env = serverEnv();
    session = sessionSchema.parse(jwt.verify(token, env.JWT_SECRET, {
      algorithms: ['HS256'],
      audience: 'gualph-web',
      issuer: env.NEXT_PUBLIC_APP_URL,
    }));
  } catch {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: { id: true, email: true, role: true, courseId: true, sessionVersion: true, isActive: true },
  });
  if (!user?.isActive || user.sessionVersion !== session.sessionVersion) return null;
  return user;
}

export async function requireUser() {
  const user = await currentUser();
  if (!user) throw new AuthError('Authentication required');
  return user;
}

export async function requireCourseUser() {
  const user = await requireUser();
  if (!user.courseId) throw new AuthError('Course access required', 403);
  return user as SessionUser & { courseId: string };
}

export async function requireRole(allowedRoles: UserRole[]) {
  const user = await requireUser();
  if (!allowedRoles.includes(user.role)) throw new AuthError('Insufficient permissions', 403);
  return user;
}

export async function requireCoursePermission(permission: Permission) {
  const user = await requireCourseUser();
  if (!hasPermission(user.role, permission)) throw new AuthError('Insufficient permissions', 403);
  return user;
}
