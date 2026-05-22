'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Assignment } from '@/lib/api';
import { useAssignmentStore } from '@/store/assignmentStore';

interface Props { assignment: Assignment; }

export default function AssignmentCard({ assignment }: Props) {
  const [open, setOpen] = useState(false);
  const { deleteAssignment } = useAssignmentStore();
  const router = useRouter();

  const handleView = () => router.push(`/assignments/${assignment._id}/result`);
  const handleDelete = async () => { setOpen(false); await deleteAssignment(assignment._id); };

  const fmt = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-');

  return (
    <div className="assignment-card">
      <div className="assignment-card-top">
        <div className="assignment-card-title" onClick={handleView} style={{ cursor: 'pointer' }}>
          {assignment.title}
        </div>
        <div style={{ position: 'relative' }}>
          <button className="menu-btn" onClick={() => setOpen((o) => !o)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>
            </svg>
          </button>
          {open && (
            <>
              <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setOpen(false)} />
              <div className="dropdown-menu" style={{ zIndex: 50 }}>
                <button className="dropdown-item" onClick={() => { setOpen(false); handleView(); }}>
                  View Assignment
                </button>
                <button className="dropdown-item danger" onClick={handleDelete}>
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="assignment-card-dates">
        <span><b>Assigned on:</b> {fmt(assignment.createdAt)}</span>
        <span><b>Due:</b> {fmt(assignment.dueDate)}</span>
      </div>
    </div>
  );
}
