import { apiOk } from '@/lib/api';
import { SESSION_COOKIE, sessionCookieOptions } from '@/lib/auth';
import { assertTrustedOrigin } from '@/lib/security';

export async function POST(request: Request) {
  assertTrustedOrigin(request);
  const response = apiOk({ loggedOut: true });
  response.cookies.set(SESSION_COOKIE, '', { ...sessionCookieOptions(), maxAge: 0 });
  return response;
}
