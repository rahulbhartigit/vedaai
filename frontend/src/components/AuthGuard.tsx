'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import Toast from './Toast';
import MobileBottomNav from './MobileBottomNav';

const PUBLIC_PATHS = ['/login', '/signup'];

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  useEffect(() => {
    if (!mounted) return;
    if (!isAuthenticated && !isPublic) router.replace('/login');
  }, [mounted, isAuthenticated, isPublic, router]);

  if (!mounted) return null;
  if (isPublic) return <>{children}</>;
  if (!isAuthenticated) return null;

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        <TopBar />
        <div className="page-inner">{children}</div>
      </main>
      <MobileBottomNav />
      <Toast />
    </div>
  );
}
