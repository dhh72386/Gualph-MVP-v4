import { redirect } from 'next/navigation';
import { currentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateTeeSheetSuggestions } from '@/lib/services/optimization';

export default async function OptimizationPage() {
  const user = await currentUser();
  if (!user) redirect('/login');
  if (!user.courseId) redirect('/admin');

  const teeTimes = await prisma.teeTime.findMany({ where: { courseId: user.courseId, startTime: { gte: new Date() } }, orderBy: { startTime: 'asc' }, take: 160 });
  const suggestions = generateTeeSheetSuggestions(teeTimes);

  return <div><div className="mb-6"><p className="eyebrow">AI-assisted operations</p><h1 className="text-3xl font-black tracking-tight">Tee Sheet Optimization</h1></div><div className="grid gap-4 lg:grid-cols-3">{suggestions.map((suggestion) => <article className="card" key={suggestion.title}><div className="flex items-center justify-between gap-3"><h2 className="text-lg font-bold">{suggestion.title}</h2><span className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-black text-emerald-800">{suggestion.impact}</span></div><p className="mt-3 text-sm leading-6 text-slate-600">{suggestion.detail}</p></article>)}</div></div>;
}
