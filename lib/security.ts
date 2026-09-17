import { serverEnv } from './env';
import { RequestError } from './errors';

const safeMethods = new Set(['GET', 'HEAD', 'OPTIONS']);

export function assertTrustedOrigin(request: Request): void {
  if (safeMethods.has(request.method.toUpperCase())) return;
  const origin = request.headers.get('origin');
  if (!origin) return;

  let actual: string;
  try {
    actual = new URL(origin).origin;
  } catch {
    throw new RequestError('Request origin is invalid', undefined, 403, 'INVALID_ORIGIN');
  }
  const expected = new URL(serverEnv().NEXT_PUBLIC_APP_URL).origin;
  if (actual !== expected) throw new RequestError('Request origin is not allowed', undefined, 403, 'INVALID_ORIGIN');
}
