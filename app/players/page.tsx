import { prisma } from '@/lib/prisma';
import { currentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { CreatePlayerForm } from '@/components/forms/CreatePlayerForm';

export default async function Players() {
  const user = await currentUser();
  if (!user) redirect('/login');
  if (!user.courseId) redirect('/admin');

  const players = await prisma.player.findMany({
    where: { courseId: user.courseId },
    orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
  });

  return <div><div className="mb-6"><p className="eyebrow">CRM</p><h1 className="text-3xl font-black tracking-tight">Players</h1></div><CreatePlayerForm/><div className="mt-6 grid gap-4 md:grid-cols-3">{players.map(p=><div className="card" key={p.id}><h2 className="font-bold">{p.firstName} {p.lastName}</h2><p className="text-sm text-slate-600">{p.email || 'No email'}</p><p className="text-sm text-slate-600">{p.phone || 'No phone'}</p><p className="mt-3 text-xs font-semibold uppercase text-slate-500">{p.loyaltyPoints} loyalty points</p></div>)}</div></div>;
}
