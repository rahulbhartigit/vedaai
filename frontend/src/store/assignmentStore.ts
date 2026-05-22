import { create } from 'zustand';
import { api, Assignment, Result } from '@/lib/api';

interface Toast { id: string; message: string; type: 'success' | 'error' | 'info'; }

interface AssignmentStore {
  assignments: Assignment[];
  currentResult: Result | null;
  loading: boolean;
  resultLoading: boolean;
  toasts: Toast[];

  fetchAssignments: () => Promise<void>;
  deleteAssignment: (id: string) => Promise<void>;
  fetchResult: (id: string) => Promise<void>;
  setResult: (result: Result) => void;
  addToast: (message: string, type: Toast['type']) => void;
  removeToast: (id: string) => void;
}

export const useAssignmentStore = create<AssignmentStore>((set, get) => ({
  assignments: [],
  currentResult: null,
  loading: false,
  resultLoading: false,
  toasts: [],

  fetchAssignments: async () => {
    set({ loading: true });
    try {
      const { data } = await api.getAssignments();
      set({ assignments: data });
    } catch (e) {
      get().addToast('Failed to load assignments', 'error');
    } finally {
      set({ loading: false });
    }
  },

  deleteAssignment: async (id) => {
    try {
      await api.deleteAssignment(id);
      set((s) => ({ assignments: s.assignments.filter((a) => a._id !== id) }));
      get().addToast('Assignment deleted', 'success');
    } catch {
      get().addToast('Failed to delete assignment', 'error');
    }
  },

  fetchResult: async (id) => {
    set({ resultLoading: true });
    try {
      const { data } = await api.getResult(id);
      set({ currentResult: data });
    } catch {
      // result not ready yet — handled by component via WS
    } finally {
      set({ resultLoading: false });
    }
  },

  setResult: (result) => set({ currentResult: result }),

  addToast: (message, type) => {
    const id = Math.random().toString(36).substring(2);
    set((s) => ({ toasts: [...s.toasts, { id, message, type }] }));
    setTimeout(() => get().removeToast(id), 4000);
  },

  removeToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));
