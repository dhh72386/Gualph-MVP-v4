import { prisma } from '@/lib/prisma';
import { currentUser } from '@/lib/auth';
import { money, time } from '@/lib/format';
import { redirect } from 'next/navigation';
import { CreateReservationForm } from '@/components/forms/CreateReservationForm';
import { ReservationActions } from '@/components/forms/ReservationActions';

export default async function Reservations() {
  const user = await currentUser();
  if (!user) redirect('/login');
  if (!user.courseId) redirect('/admin');

  const rows = await prisma.reservation.findMany({
    where: { teeTime: { courseId: user.courseId } },
    include: { teeTime: true, player: true },
    orderBy: { createdAt: 'desc' },
  });
  const [availableTeeTimes, players] = await Promise.all([
    prisma.teeTime.findMany({ where: { courseId: user.courseId, status: 'AVAILABLE' }, orderBy: { startTime: 'asc' }, take: 100 }),
    prisma.player.findMany({ where: { courseId: user.courseId }, orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }] }),
  ]);

  return <div><div className="mb-6"><p className="eyebrow">Reservation engine</p><h1 className="text-3xl font-black tracking-tight">Reservations</h1></div><CreateReservationForm teeTimes={availableTeeTimes.map((teeTime) => ({ id: teeTime.id, label: `${time(teeTime.startTime)} | ${money(teeTime.greenFeeCents + teeTime.cartFeeCents)}` }))} players={players.map((player) => ({ id: player.id, label: `${player.lastName}, ${player.firstName}` }))}/><div className="panel mt-6 overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b bg-slate-50"><th className="px-4 py-3">Code</th><th>Player</th><th>Time</th><th>Party</th><th>Total</th><th>Status</th><th className="pr-4 text-right">Actions</th></tr></thead><tbody>{rows.map(r=><tr key={r.id} className="border-b last:border-0"><td className="px-4 py-3 font-mono">{r.confirmationCode}</td><td>{r.player.firstName} {r.player.lastName}</td><td>{time(r.teeTime.startTime)}</td><td>{r.partySize}</td><td>{money(r.totalCents)}</td><td>{r.status}</td><td className="py-2 pr-4 text-right"><ReservationActions reservationId={r.id} status={r.status}/></td></tr>)}</tbody></table></div></div>;
}
