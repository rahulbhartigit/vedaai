import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  schoolName: string;
}

interface AuthStore {
  user: AuthUser | null;
  token: string | null;
  login: (user: AuthUser, token: string) => void;
  updateUser: (user: AuthUser, token: string) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,

      login: (user, token) => set({ user, token }),
      updateUser: (user, token) => set({ user, token }),
      logout: () => set({ user: null, token: null }),
      isAuthenticated: () => !!get().token && !!get().user,
    }),
    {
      name: 'vedaai-auth', // key in localStorage
    }
  )
);
