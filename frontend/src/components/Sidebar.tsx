'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useAssignmentStore } from '@/store/assignmentStore';

export default function Sidebar() {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  // Derive count from the shared store — updates instantly on delete/create
  const assignmentCount = useAssignmentStore((s) => s.assignments.length);

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 7l10 5 10-5-10-5z" fill="#fff"/>
            <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>
        <span className="sidebar-logo-text">VedaAI</span>
      </div>

      {/* Create Assignment CTA */}
      <Link href="/assignments/create" className="sidebar-create-btn">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Create Assignment
      </Link>

      {/* Nav */}
      <nav className="sidebar-nav">
        {[
          { href: '/',          realHref: '/home',   label: 'Home',                icon: <HomeIcon /> },
          { href: '/groups',    realHref: '/groups',  label: 'My Groups',           icon: <GroupIcon /> },
          { href: '/assignments', realHref: '/',      label: 'Assignments',         icon: <DocIcon />, badge: true },
          { href: '/toolkit',   realHref: '/toolkit', label: "AI Teacher's Toolkit", icon: <SparkIcon /> },
          { href: '/library',   realHref: '/library', label: 'My Library',          icon: <BookIcon /> },
        ].map(({ href, realHref, label, icon, badge }) => {
          // Assignments is active on / and /assignments/* ; Home only on /home
          const active =
            href === '/assignments'
              ? pathname === '/' || pathname.startsWith('/assignments')
              : href === '/'
                ? pathname === '/home'
                : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={realHref}
              className={`nav-item ${active ? 'active' : ''}`}
            >
              {icon}
              {label}
              {badge && assignmentCount > 0 && (
                <span className="nav-badge">{assignmentCount}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div className="sidebar-settings">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
          Settings
        </div>
        <div className="school-badge">
          <div className="school-avatar" style={{ background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff' }}>
            {user?.schoolName ? user.schoolName[0].toUpperCase() : user?.name?.[0]?.toUpperCase() ?? 'V'}
          </div>
          <div>
            <div className="school-name">{user?.schoolName || 'School / College Name'}</div>
            <div className="school-location">{user?.name || 'Your Account'}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}

function HomeIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>; }
function GroupIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>; }
function DocIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>; }
function SparkIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>; }
function BookIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>; }
