const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

function getToken(): string | null {
  try {
    const raw = localStorage.getItem('vedaai-auth');
    if (!raw) return null;
    return JSON.parse(raw)?.state?.token || null;
  } catch {
    return null;
  }
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const api = {
  getAssignments: () => apiFetch<{ success: boolean; data: Assignment[] }>('/api/assignments'),

  createAssignment: (formData: FormData) => {
    const token = getToken();
    return fetch(`${API_BASE}/api/assignments`, {
      method: 'POST',
      body: formData,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }).then(async (r) => {
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Failed to create');
      return d;
    });
  },

  getAssignment: (id: string) =>
    apiFetch<{ success: boolean; data: Assignment }>(`/api/assignments/${id}`),

  deleteAssignment: (id: string) =>
    apiFetch<{ success: boolean }>(`/api/assignments/${id}`, { method: 'DELETE' }),

  getResult: (id: string) =>
    apiFetch<{ success: boolean; data: Result; fromCache: boolean }>(`/api/assignments/${id}/result`),

  regenerate: (id: string) =>
    apiFetch<{ success: boolean; jobId: string }>(`/api/assignments/${id}/regenerate`, { method: 'POST' }),
};

export interface QuestionType { type: string; count: number; marks: number; }
export interface Assignment {
  _id: string; title: string; subject: string; branch: string; dueDate: string;
  questionTypes: QuestionType[]; additionalInstructions?: string;
  status: 'pending' | 'processing' | 'done' | 'failed'; jobId?: string; createdAt: string;
}
export interface Question { text: string; difficulty: 'easy' | 'moderate' | 'hard'; marks: number; type: string; }
export interface Section { title: string; instruction: string; questions: Question[]; }
export interface Result {
  _id: string; assignmentId: string; sections: Section[];
  totalMarks: number; totalQuestions: number; subject: string; title: string;
  branch: string; schoolName: string; createdAt: string;
}
