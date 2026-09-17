import './globals.css';
import { AppShell } from '@/components/shell/AppShell';

export const metadata = { title: 'Gualph', description: 'Golf course operating system' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body><AppShell>{children}</AppShell></body></html>;
}
