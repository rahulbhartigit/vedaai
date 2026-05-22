const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface AuthResponse {
  success: boolean;
  token?: string;
  user?: { id: string; name: string; email: string; schoolName: string };
  message?: string;
  error?: string;
}

async function authFetch(path: string, body: object, token?: string): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const authApi = {
  signup: (name: string, email: string, password: string) =>
    authFetch('/api/auth/signup', { name, email, password }),

  verifyOtp: (email: string, otp: string) =>
    authFetch('/api/auth/verify-otp', { email, otp }),

  login: (email: string, password: string) =>
    authFetch('/api/auth/login', { email, password }),

  setSchool: async (schoolName: string, token: string): Promise<AuthResponse> => {
    const res = await fetch(`${API_BASE}/api/auth/school`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ schoolName }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update school');
    return data;
  },
};
