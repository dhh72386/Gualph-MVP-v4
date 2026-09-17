import { redirect } from 'next/navigation';
import { currentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getCourseAnalytics } from '@/lib/services/analytics';
import { recommendTeeTimePrice } from '@/lib/services/pricing';
import { money, time } from '@/lib/format';
import { ApplyPriceButton } from '@/components/forms/ApplyPriceButton';

export default async function PricingPage() {
  const user = await currentUser();
  if (!user) redirect('/login');
  if (!user.courseId) redirect('/admin');

  const [analytics, teeTimes] = await Promise.all([
    getCourseAnalytics(user.courseId),
    prisma.teeTime.findMany({ where: { courseId: user.courseId, status: 'AVAILABLE', startTime: { gte: new Date() } }, orderBy: { startTime: 'asc' }, take: 80 }),
  ]);
  const recommendations = teeTimes.map((teeTime) => ({ teeTime, recommendation: recommendTeeTimePrice(teeTime, analytics.occupancyRate) }));

  return <div><div className="mb-6"><p className="eyebrow">Revenue management</p><h1 className="text-3xl font-black tracking-tight">Dynamic Pricing</h1></div><div className="panel overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b bg-slate-50"><th className="px-4 py-3">Time</th><th>Current</th><th>Recommended</th><th>Signal</th><th></th></tr></thead><tbody>{recommendations.map(({ teeTime, recommendation }) => <tr key={teeTime.id} className="border-b last:border-0"><td className="px-4 py-3 font-semibold">{time(teeTime.startTime)}</td><td>{money(recommendation.currentGreenFeeCents)}</td><td className="font-bold">{money(recommendation.recommendedGreenFeeCents)}</td><td>{recommendation.reason}</td><td className="py-2 pr-4 text-right"><ApplyPriceButton teeTimeId={teeTime.id}/></td></tr>)}</tbody></table></div></div>;
}
