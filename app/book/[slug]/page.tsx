import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { money, time } from '@/lib/format';
import { PublicBookingForm } from '@/components/forms/PublicBookingForm';

export default async function PublicBookingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const course = await prisma.course.findUnique({
    where: { slug },
    include: {
      teeTimes: {
        where: { status: 'AVAILABLE', startTime: { gte: new Date() } },
        orderBy: { startTime: 'asc' },
        take: 24,
      },
    },
  });
  if (!course) notFound();

  return (
    <div className="mx-auto max-w-5xl">
      <section className="mb-6 rounded-lg bg-emerald-900 p-8 text-white">
        <p className="text-sm font-bold uppercase tracking-wider text-emerald-200">Book direct</p>
        <h1 className="mt-2 text-4xl font-black tracking-tight">{course.name}</h1>
        <p className="mt-3 max-w-2xl text-emerald-50">{course.description || `${course.holes} holes in ${course.city}, ${course.state}. Compare live availability and reserve instantly.`}</p>
      </section>
      <div className="grid gap-4">
        {course.teeTimes.map((teeTime) => (
          <article key={teeTime.id} className="card">
            <div className="flex flex-col justify-between gap-3 sm:flex-row">
              <div>
                <p className="text-2xl font-black">{time(teeTime.startTime)}</p>
                <p className="text-sm text-slate-500">{teeTime.playersAllowed} players available</p>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-2xl font-black">{money(teeTime.greenFeeCents + teeTime.cartFeeCents)}</p>
                <p className="text-sm text-slate-500">green + cart</p>
              </div>
            </div>
            <PublicBookingForm teeTimeId={teeTime.id} maxPartySize={teeTime.playersAllowed} />
          </article>
        ))}
        {!course.teeTimes.length ? <div className="card"><p className="font-semibold">No tee times are currently available for online booking.</p></div> : null}
      </div>
    </div>
  );
}
