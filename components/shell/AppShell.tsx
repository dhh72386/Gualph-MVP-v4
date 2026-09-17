'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, CalendarDays, Flag, Gauge, Settings, Sparkles, Tags, Users } from 'lucide-react';

const nav = [
  { href: '/dashboard', label: 'Dashboard', icon: Gauge },
  { href: '/tee-sheet', label: 'Tee Sheet', icon: CalendarDays },
  { href: '/reservations', label: 'Reservations', icon: Flag },
  { href: '/players', label: 'Players', icon: Users },
  { href: '/pricing', label: 'Pricing', icon: Tags },
  { href: '/optimization', label: 'Optimization', icon: Sparkles },
  { href: '/reports', label: 'Reports', icon: BarChart3 },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPublicBooking = pathname.startsWith('/book');

  if (isPublicBooking) {
    return (
      <div className="min-h-screen bg-slate-100">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
            <Link href="/" className="text-2xl font-black tracking-tight text-emerald-800">Gualph</Link>
            <Link href="/login" className="text-sm font-semibold text-slate-700">Course login</Link>
          </div>
        </header>
        <main className="px-4 py-6">{children}</main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-slate-200 bg-white lg:block">
        <div className="flex h-16 items-center border-b border-slate-200 px-6">
          <Link href="/dashboard" className="text-2xl font-black tracking-tight text-emerald-800">Gualph</Link>
        </div>
        <nav className="space-y-1 p-3">
          {nav.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-800">
                <Icon className="h-4 w-4" aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <div className="lg:pl-64">
        <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
            <Link href="/dashboard" className="text-xl font-black text-emerald-800 lg:hidden">Gualph</Link>
            <nav className="flex gap-3 overflow-x-auto text-sm lg:hidden">
              <Link href="/tee-sheet">Tee Sheet</Link>
              <Link href="/pricing">Pricing</Link>
              <Link href="/reports">Reports</Link>
            </nav>
            <Link href="/book/evergreen-demo" className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Public booking</Link>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
