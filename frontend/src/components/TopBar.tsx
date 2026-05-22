'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

const breadcrumbMap: Record<string, string> = {
  '/': 'Assignments',
  '/assignments/create': 'Create Assignment',
};

export default function TopBar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);

  const label = breadcrumbMap[pathname] || 'Assignment';
  const showBack = pathname !== '/';

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  const handleLogout = () => { logout(); router.push('/login'); };

  return (
    <header className="topbar">
      {/* ── Desktop left: breadcrumb + school badge ───────────────────── */}
      <div className="topbar-left">
        {/* Mobile: show VedaAI logo instead of breadcrumb */}
        <Link href="/" className="topbar-mobile-logo">
          <div className="sidebar-logo-icon" style={{ width: 30, height: 30 }}>
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5z" fill="#fff"/>
              <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <span className="sidebar-logo-text">VedaAI</span>
        </Link>

        {/* Desktop: back button + breadcrumb */}
        <div className="topbar-desktop-nav">
          {showBack && (
            <button className="topbar-back" onClick={() => router.back()}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
          )}
          <div className="topbar-breadcrumb">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            {label}
          </div>
          {user?.schoolName && (
            <span className="topbar-school">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
              {user.schoolName}
            </span>
          )}
        </div>
      </div>

      {/* ── Right: bell + profile ────────────────────────────────────────── */}
      <div className="topbar-right">
        <div className="topbar-bell">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>
          <span className="bell-dot" />
        </div>

        <div className="topbar-profile" onClick={() => setMenuOpen((o) => !o)} style={{ position: 'relative', cursor: 'pointer' }}>
          <div className="profile-avatar">{initials}</div>
          <div className="profile-info topbar-profile-info-desktop">
            <span className="profile-name">{user?.name || 'User'}</span>
            {user?.schoolName && <span className="profile-school">{user.schoolName}</span>}
          </div>
          <span className="profile-chevron topbar-chevron-desktop">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
          </span>

          {menuOpen && (
            <div className="profile-menu" onClick={(e) => e.stopPropagation()}>
              <div className="profile-menu-email">{user?.email}</div>
              <button className="profile-menu-logout" onClick={handleLogout}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
