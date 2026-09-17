import { apiOk } from '@/lib/api';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  await prisma.$queryRaw`SELECT 1`;
  return apiOk({ status: 'healthy' });
}
