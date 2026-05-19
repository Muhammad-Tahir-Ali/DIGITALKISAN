import { create } from 'zustand';

export type UserRole = 'farmer' | 'buyer' | 'logistics' | 'admin' | null;

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  avatar?: string;
  isVerified: boolean;
  createdAt: string;
  docReviewStatus?: 'not_required' | 'pending_review' | 'approved' | 'rejected';
  docReviewNote?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  role: UserRole;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  setUser: (user: User) => void;
  setTokens: (token: string, refreshToken: string) => void;
  setRole: (role: UserRole) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  logout: () => void;
  hydrate: (user: User, token: string, refreshToken: string) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  refreshToken: null,
  role: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  setUser: (user) =>
    set({ user, role: user.role, isAuthenticated: true, error: null }),

  setTokens: (token, refreshToken) =>
    set({ token, refreshToken }),

  setRole: (role) =>
    set({ role }),

  setLoading: (isLoading) =>
    set({ isLoading }),

  setError: (error) =>
    set({ error }),

  logout: () =>
    set({
      user: null,
      token: null,
      refreshToken: null,
      role: null,
      isAuthenticated: false,
      error: null,
    }),

  hydrate: (user, token, refreshToken) =>
    set({
      user,
      token,
      refreshToken,
      role: user.role,
      isAuthenticated: true,
      isLoading: false,
    }),
}));
