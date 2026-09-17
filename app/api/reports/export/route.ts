import { NextResponse } from 'next/server';
import { handleApiError } from '@/lib/api';
import { requireCoursePermission } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { toCsv } from '@/lib/services/csv';
import { money } from '@/lib/format';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await requireCoursePermission('report:export');
    const reservations = await prisma.reservation.findMany({
      where: { teeTime: { courseId: user.courseId } },
      include: { teeTime: true, player: true },
      orderBy: { createdAt: 'desc' },
    });

    const csv = toCsv(reservations.map((reservation) => ({
      confirmationCode: reservation.confirmationCode,
      player: `${reservation.player.firstName} ${reservation.player.lastName}`,
      email: reservation.player.email,
      startTime: reservation.teeTime.startTime.toISOString(),
      partySize: reservation.partySize,
      status: reservation.status,
      total: money(reservation.totalCents),
    })));

    await prisma.auditLog.create({ data: { courseId: user.courseId, actorId: user.id, action: 'EXPORT', entity: 'Reservation', metadata: { recordCount: reservations.length } } });

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="gualph-reservations.csv"',
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
