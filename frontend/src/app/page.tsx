'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAssignmentStore } from '@/store/assignmentStore';
import AssignmentCard from '@/components/AssignmentCard';

export default function HomePage() {
  const { assignments, loading, fetchAssignments } = useAssignmentStore();
  const [search, setSearch] = useState('');

  useEffect(() => { fetchAssignments(); }, [fetchAssignments]);

  const filtered = assignments.filter((a) =>
    a.title.toLowerCase().includes(search.toLowerCase()) ||
    a.subject.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="processing-card">
        <div className="spinner" />
      </div>
    );
  }

  if (assignments.length === 0) {
    return (
      <div className="empty-state">
        {/* Illustrated empty state matching Figma */}
        <svg className="empty-illustration" viewBox="0 0 200 200" fill="none">
          <rect x="55" y="30" width="90" height="110" rx="8" fill="#f3f4f6" stroke="#d1d5db" strokeWidth="2"/>
          <rect x="70" y="50" width="60" height="6" rx="3" fill="#d1d5db"/>
          <rect x="70" y="64" width="40" height="6" rx="3" fill="#e5e7eb"/>
          <rect x="70" y="78" width="50" height="6" rx="3" fill="#e5e7eb"/>
          <circle cx="110" cy="115" r="36" fill="#f9fafb" stroke="#d1d5db" strokeWidth="2"/>
          <circle cx="110" cy="115" r="28" fill="#fee2e2"/>
          <line x1="102" y1="107" x2="118" y2="123" stroke="#ef4444" strokeWidth="3" strokeLinecap="round"/>
          <line x1="118" y1="107" x2="102" y2="123" stroke="#ef4444" strokeWidth="3" strokeLinecap="round"/>
          <circle cx="68" cy="148" r="5" fill="#bfdbfe"/>
          <circle cx="154" cy="80" r="4" fill="#bfdbfe"/>
          <path d="M75 40 Q80 32 85 40" stroke="#9ca3af" strokeWidth="1.5" fill="none"/>
        </svg>
        <h2 className="empty-title">No assignments yet</h2>
        <p className="empty-desc">
          Create your first assignment to start collecting and grading student submissions.
          You can set up rubrics, define marking criteria, and let AI assist with grading.
        </p>
        <Link href="/assignments/create" className="btn-create-first">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Create Your First Assignment
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="page-heading">
        <span className="page-heading-dot" />
        <h1 className="page-title">Assignments</h1>
      </div>
      <p className="page-subtitle">Manage and create assignments for your classes.</p>

      {/* Filter + Search */}
      <div className="filter-bar">
        <button className="filter-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
          Filter By
        </button>
        <div className="search-bar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            className="search-input"
            placeholder="Search Assignment"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Grid */}
      <div className="assignment-grid">
        {filtered.map((a) => <AssignmentCard key={a._id} assignment={a} />)}
      </div>

      {/* Floating button */}
      <Link href="/assignments/create" className="floating-create">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Create Assignment
      </Link>
    </div>
  );
}
