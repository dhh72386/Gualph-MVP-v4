'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

type CourseProfile = {
  name: string;
  description: string | null;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string | null;
  email: string | null;
  website: string | null;
  holes: number;
  timezone: string;
  amenities: string[];
};

export function CourseProfileForm({ course }: { course: CourseProfile }) {
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');
    setIsSaving(true);
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    const body = {
      ...data,
      holes: Number(data.holes),
      amenities: String(data.amenities || '').split(',').map((item) => item.trim()).filter(Boolean),
    };
    const response = await fetch('/api/courses', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    setIsSaving(false);
    setMessage(response.ok ? 'Course profile saved.' : 'Course profile could not be saved.');
    if (response.ok) router.refresh();
  }

  return (
    <form onSubmit={submit} className="card">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="eyebrow">Course management</p>
          <h2 className="text-lg font-bold">Profile</h2>
        </div>
        <button className="btn" disabled={isSaving}>{isSaving ? 'Saving' : 'Save changes'}</button>
      </div>
      {message ? <p className="mt-3 text-sm font-semibold text-emerald-700">{message}</p> : null}
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <label className="label md:col-span-2">Course name<input className="input mt-1" name="name" defaultValue={course.name} required /></label>
        <label className="label md:col-span-2">Description<textarea className="input mt-1 min-h-24" name="description" defaultValue={course.description || ''} /></label>
        <label className="label md:col-span-2">Address<input className="input mt-1" name="address" defaultValue={course.address} /></label>
        <label className="label">City<input className="input mt-1" name="city" defaultValue={course.city} required /></label>
        <label className="label">State<input className="input mt-1" name="state" defaultValue={course.state} required /></label>
        <label className="label">ZIP<input className="input mt-1" name="zip" defaultValue={course.zip} required /></label>
        <label className="label">Phone<input className="input mt-1" name="phone" defaultValue={course.phone || ''} /></label>
        <label className="label">Email<input className="input mt-1" name="email" type="email" defaultValue={course.email || ''} /></label>
        <label className="label">Website<input className="input mt-1" name="website" type="url" defaultValue={course.website || ''} /></label>
        <label className="label">Holes<input className="input mt-1" name="holes" type="number" min="1" max="72" defaultValue={course.holes} /></label>
        <label className="label">Timezone<input className="input mt-1" name="timezone" defaultValue={course.timezone} /></label>
        <label className="label md:col-span-2">Amenities<input className="input mt-1" name="amenities" defaultValue={course.amenities.join(', ')} placeholder="Driving range, Pro shop, Lessons" /></label>
      </div>
    </form>
  );
}
