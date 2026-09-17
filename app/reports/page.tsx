import Link from 'next/link';
import { redirect } from 'next/navigation';
import { currentUser } from '@/lib/auth';
import { getCourseAnalytics } from '@/lib/services/analytics';
import { Kpi } from '@/components/Kpi';
import { money } from '@/lib/format';

export default async function ReportsPage() {
  const user = await currentUser();
  if (!user) redirect('/login');
  if (!user.courseId) redirect('/admin');

  const analytics = await getCourseAnalytics(user.courseId);

  return <div><div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="eyebrow">Reporting</p><h1 className="text-3xl font-black tracking-tight">Reports & Exports</h1></div><Link className="btn" href="/api/reports/export">Export reservations CSV</Link></div><div className="grid gap-4 md:grid-cols-4"><Kpi label="Revenue" value={money(analytics.revenueCents)}/><Kpi label="Reservations" value={analytics.reservationCount}/><Kpi label="Rounds" value={analytics.roundsBooked}/><Kpi label="Cancellation rate" value={`${Math.round(analytics.cancellationRate * 100)}%`}/></div><div className="card mt-6"><h2 className="text-xl font-bold">Integration-ready summary API</h2><p className="mt-2 text-slate-600">Use <code className="rounded bg-slate-100 px-1 py-0.5">GET /api/reports/summary</code> for authenticated course analytics and <code className="rounded bg-slate-100 px-1 py-0.5">GET /api/reports/export</code> for reservation CSV exports.</p></div></div>;
}
