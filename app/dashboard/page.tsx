import { currentUser } from '@/lib/auth';
import { Kpi } from '@/components/Kpi';
import { money } from '@/lib/format';
import { redirect } from 'next/navigation';
import { getCourseAnalytics } from '@/lib/services/analytics';

export default async function Dashboard() {
  const user = await currentUser();
  if (!user) redirect('/login');
  if (!user.courseId) redirect('/admin');

  const analytics = await getCourseAnalytics(user.courseId);

  return <div><div className="mb-6"><p className="eyebrow">Command center</p><h1 className="text-3xl font-black tracking-tight">Operator Dashboard</h1></div><div className="grid gap-4 md:grid-cols-4"><Kpi label="Revenue" value={money(analytics.revenueCents)} hint="Gross booked value"/><Kpi label="Rounds booked" value={analytics.roundsBooked}/><Kpi label="Occupancy" value={`${Math.round(analytics.occupancyRate * 100)}%`}/><Kpi label="Players" value={analytics.playerCount}/></div><div className="mt-6 grid gap-4 lg:grid-cols-3"><div className="card lg:col-span-2"><h2 className="text-xl font-bold">Daily utilization</h2><div className="mt-4 grid gap-3 sm:grid-cols-3"><Kpi label="Available" value={analytics.availableTeeTimes}/><Kpi label="Reserved" value={analytics.reservedTeeTimes}/><Kpi label="Blocked" value={analytics.blockedTeeTimes}/></div></div><div className="card"><h2 className="text-xl font-bold">Cancellation health</h2><p className="mt-4 text-4xl font-black">{Math.round(analytics.cancellationRate * 100)}%</p><p className="mt-2 text-sm text-slate-500">{analytics.cancellationCount} cancellations across {analytics.reservationCount} reservations.</p></div></div></div>;
}
