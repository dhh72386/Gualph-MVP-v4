import { prisma } from '@/lib/prisma';
import { currentUser } from '@/lib/auth';
import { money, time } from '@/lib/format';
import { redirect } from 'next/navigation';
import { CreateTeeTimeForm } from '@/components/forms/CreateTeeTimeForm';

export default async function TeeSheet() {
  const user = await currentUser();
  if (!user) redirect('/login');
  if (!user.courseId) redirect('/admin');

  const teeTimes = await prisma.teeTime.findMany({
    where: { courseId: user.courseId },
    orderBy: { startTime: 'asc' },
    include: { reservation: { include: { player: true } } },
  });

  return <div><div className="mb-6"><p className="eyebrow">Inventory control</p><h1 className="text-3xl font-black tracking-tight">Tee Sheet</h1></div><CreateTeeTimeForm/><div className="panel mt-6 overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b bg-slate-50"><th className="px-4 py-3">Time</th><th>Status</th><th>Fee</th><th>Capacity</th><th>Reservation</th></tr></thead><tbody>{teeTimes.map(t=><tr key={t.id} className="border-b last:border-0"><td className="px-4 py-3 font-semibold">{time(t.startTime)}</td><td>{t.status}</td><td>{money(t.greenFeeCents+t.cartFeeCents)}</td><td>{t.playersAllowed}</td><td>{t.reservation ? `${t.reservation.player.firstName} ${t.reservation.player.lastName} (${t.reservation.partySize})` : '-'}</td></tr>)}</tbody></table></div></div>;
}
