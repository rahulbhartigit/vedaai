'use client';
import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

const BREADCRUMBS: Record<string, string> = {
  '/':                    'Assignment',
  '/assignments/create':  'Create Assignment',
  '/home':                'Home',
  '/groups':              'My Groups',
  '/toolkit':             "AI Teacher's Toolkit",
  '/library':             'My Library',
};

export default function TopBar() {
  const router   = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);

  const label    = BREADCRUMBS[pathname] ?? 'Assignment';
  const showBack = pathname !== '/';

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  const handleLogout = () => { logout(); router.push('/login'); };

  return (
    <header className="topbar">
      {/* ── Left ── */}
      <div className="topbar-left">
        {showBack && (
          <button className="topbar-back" onClick={() => router.back()} aria-label="Go back">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
        )}

        {/* Grid icon + breadcrumb label */}
        <div className="topbar-breadcrumb">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
            <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
            <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
          </svg>
          <span>{label}</span>
        </div>
      </div>

      {/* ── Right ── */}
      <div className="topbar-right">
        {/* Bell */}
        <div className="topbar-bell" aria-label="Notifications">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 01-3.46 0"/>
          </svg>
          <span className="bell-dot" />
        </div>

        {/* Profile */}
        <div
          className="topbar-profile"
          onClick={() => setMenuOpen((o) => !o)}
          style={{ position: 'relative' }}
        >
          <div className="profile-avatar">{initials}</div>
          <span className="profile-name topbar-profile-name-desktop">{user?.name || 'User'}</span>
          <span className="profile-chevron topbar-chevron-desktop">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </span>

          {menuOpen && (
            <div className="profile-menu" onClick={(e) => e.stopPropagation()}>
              <div className="profile-menu-email">{user?.email}</div>
              <button className="profile-menu-logout" onClick={handleLogout}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
