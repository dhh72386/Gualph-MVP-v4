import { Prisma } from '@prisma/client';
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { AuthError } from '@/lib/auth';
import { RequestError } from '@/lib/errors';

type ApiSuccess<T> = {
  ok: true;
  data: T;
};

type ApiFailure = {
  ok: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

export function apiOk<T>(data: T, init?: ResponseInit) {
  return NextResponse.json<ApiSuccess<T>>({ ok: true, data }, init);
}

export function apiCreated<T>(data: T) {
  return apiOk(data, { status: 201 });
}

export function apiError(code: string, message: string, status: number, details?: unknown) {
  return NextResponse.json<ApiFailure>({ ok: false, error: { code, message, details } }, { status });
}

export async function parseJson(req: Request) {
  try {
    return await req.json();
  } catch {
    throw new RequestError('Malformed JSON request body');
  }
}

export function handleApiError(error: unknown) {
  if (error instanceof AuthError) {
    return apiError(error.status === 401 ? 'UNAUTHORIZED' : 'FORBIDDEN', error.message, error.status);
  }

  if (error instanceof RequestError) {
    return apiError(error.code, error.message, error.status, error.details);
  }

  if (error instanceof ZodError) {
    return apiError('VALIDATION_ERROR', 'Request validation failed', 400, error.flatten());
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') return apiError('CONFLICT', 'The requested resource conflicts with an existing record', 409);
    if (error.code === 'P2025') return apiError('NOT_FOUND', 'Record not found', 404);
    if (error.code === 'P2034') return apiError('TRANSACTION_CONFLICT', 'The request conflicted with another operation; retry safely', 409);
  }

  console.error(JSON.stringify({ level: 'error', event: 'api_request_failed', errorType: error instanceof Error ? error.name : 'UnknownError' }));
  return apiError('INTERNAL_SERVER_ERROR', 'An unexpected error occurred', 500);
}
