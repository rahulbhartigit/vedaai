'use client';
import { useAssignmentStore } from '@/store/assignmentStore';

export default function Toast() {
  const { toasts, removeToast } = useAssignmentStore();
  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.type}`} onClick={() => removeToast(t.id)}>
          {t.message}
        </div>
      ))}
    </div>
  );
}
