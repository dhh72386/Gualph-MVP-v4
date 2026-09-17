import type { UserRole } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { serverEnv } from './env';

export type SessionUser = {
  id: string;
  email: string;
  role: UserRole;
  courseId?: string | null;
  sessionVersion: number;
};

export function signSession(user: SessionUser) {
  const env = serverEnv();
  return jwt.sign({ id: user.id, sessionVersion: user.sessionVersion }, env.JWT_SECRET, {
    algorithm: 'HS256',
    audience: 'gualph-web',
    issuer: env.NEXT_PUBLIC_APP_URL,
    expiresIn: '8h',
  });
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 8,
  };
}
