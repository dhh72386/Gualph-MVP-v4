import { prisma } from '@/lib/prisma';
import { currentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { CourseProfileForm } from '@/components/forms/CourseProfileForm';

export default async function Settings() {
  const user = await currentUser();
  if (!user) redirect('/login');
  if (!user.courseId) redirect('/admin');

  const course = await prisma.course.findUniqueOrThrow({ where: { id: user.courseId } });

  return <div><div className="mb-6"><p className="eyebrow">Administration</p><h1 className="text-3xl font-black tracking-tight">Course Settings</h1></div><CourseProfileForm course={course}/><div className="card mt-6"><h2 className="text-xl font-bold">Public booking URL</h2><p className="mt-2 text-slate-600">Share <code className="rounded bg-slate-100 px-1 py-0.5">/book/{course.slug}</code> with golfers to accept direct online bookings.</p></div></div>;
}
