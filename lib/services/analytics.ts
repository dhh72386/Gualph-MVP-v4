import { prisma } from '@/lib/prisma';

export async function getCourseAnalytics(courseId: string) {
  const [teeTimeCounts, reservationTotals, cancellations, players] = await Promise.all([
    prisma.teeTime.groupBy({
      by: ['status'],
      where: { courseId },
      _count: { _all: true },
    }),
    prisma.reservation.aggregate({
      where: { teeTime: { courseId } },
      _sum: { totalCents: true, partySize: true },
      _count: { _all: true },
    }),
    prisma.reservation.count({
      where: { teeTime: { courseId }, status: 'CANCELLED' },
    }),
    prisma.player.count({ where: { courseId } }),
  ]);

  const counts = Object.fromEntries(teeTimeCounts.map((row) => [row.status, row._count._all]));
  const available = counts.AVAILABLE ?? 0;
  const reserved = counts.RESERVED ?? 0;
  const blocked = counts.BLOCKED ?? 0;
  const totalTeeTimes = available + reserved + blocked;

  return {
    availableTeeTimes: available,
    reservedTeeTimes: reserved,
    blockedTeeTimes: blocked,
    totalTeeTimes,
    occupancyRate: totalTeeTimes > 0 ? reserved / totalTeeTimes : 0,
    roundsBooked: reservationTotals._sum.partySize ?? 0,
    reservationCount: reservationTotals._count._all,
    cancellationCount: cancellations,
    cancellationRate: reservationTotals._count._all > 0 ? cancellations / reservationTotals._count._all : 0,
    revenueCents: reservationTotals._sum.totalCents ?? 0,
    playerCount: players,
  };
}
