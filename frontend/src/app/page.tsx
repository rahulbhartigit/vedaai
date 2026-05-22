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
        {/* Illustration — matches reference: document + magnifying glass + red X */}
        <svg className="empty-illustration" viewBox="0 0 220 220" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Background circle */}
          <circle cx="110" cy="110" r="90" fill="#EBEBEB"/>

          {/* Document (behind magnifier) */}
          <rect x="68" y="54" width="72" height="90" rx="7" fill="#fff" stroke="#D1D5DB" strokeWidth="2"/>
          {/* Document lines */}
          <rect x="80" y="72" width="48" height="5" rx="2.5" fill="#1E293B"/>
          <rect x="80" y="84" width="38" height="4" rx="2" fill="#D1D5DB"/>
          <rect x="80" y="94" width="44" height="4" rx="2" fill="#D1D5DB"/>
          <rect x="80" y="104" width="32" height="4" rx="2" fill="#E5E7EB"/>

          {/* Pencil / curl detail top-left of doc */}
          <path d="M75 58 Q70 48 78 44 Q72 52 75 58Z" stroke="#9CA3AF" strokeWidth="1.5" fill="none" strokeLinecap="round"/>

          {/* Magnifying glass circle */}
          <circle cx="122" cy="128" r="34" fill="#F3F4F6" stroke="#D1D5DB" strokeWidth="2.5"/>
          <circle cx="122" cy="128" r="26" fill="#FEE2E2"/>

          {/* Red X inside magnifier */}
          <line x1="113" y1="119" x2="131" y2="137" stroke="#EF4444" strokeWidth="3.5" strokeLinecap="round"/>
          <line x1="131" y1="119" x2="113" y2="137" stroke="#EF4444" strokeWidth="3.5" strokeLinecap="round"/>

          {/* Magnifier handle */}
          <line x1="148" y1="150" x2="158" y2="162" stroke="#9CA3AF" strokeWidth="4" strokeLinecap="round"/>

          {/* Small blue dots (sparkles) */}
          <circle cx="72" cy="162" r="5.5" fill="#BFDBFE"/>
          <circle cx="162" cy="86"  r="4.5" fill="#BFDBFE"/>
        </svg>

        <h2 className="empty-title">No assignments yet</h2>
        <p className="empty-desc">
          Create your first assignment to start collecting and grading student
          submissions. You can set up rubrics, define marking criteria, and let AI
          assist with grading.
        </p>
        <Link href="/assignments/create" className="btn-create-first">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
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
