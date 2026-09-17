import { prisma } from '@/lib/prisma';
import { currentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function Admin() {
  const user = await currentUser();
  if (!user) redirect('/login');
  if (user.role !== 'SUPER_ADMIN') redirect('/dashboard');

  const courses = await prisma.course.findMany({
    include: { _count: { select: { users: true, teeTimes: true, players: true } } },
    orderBy: { name: 'asc' },
  });

  return <div><h1 className="mb-6 text-3xl font-black">Gualph Admin</h1><div className="grid gap-4">{courses.map(c=><div className="card" key={c.id}><h2 className="text-xl font-bold">{c.name}</h2><p>{c.city}, {c.state}</p><p className="mt-2 text-sm text-slate-600">Users: {c._count.users} | Tee times: {c._count.teeTimes} | Players: {c._count.players}</p></div>)}</div></div>;
}
