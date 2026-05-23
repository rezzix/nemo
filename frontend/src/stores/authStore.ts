import { create } from 'zustand';
import axios from 'axios';
import type { UserDto } from '@/types';
import * as authApi from '@/api/auth';

interface AuthState {
  user: UserDto | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (username: string, password: string, captcha?: string) => Promise<void>;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
  clearError: () => void;
  updateUser: (user: Partial<UserDto>) => void;
  sessionExpired: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  error: null,
  isAuthenticated: false,

  login: async (username, password, captcha) => {
    set({ isLoading: true, error: null });
    try {
      const user = await authApi.login({ username, password, captcha });
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (err: unknown) {
      let message = 'An error occurred. Please try again.';
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        if (!err.response) {
          message = 'Unable to connect. Please check your connection.';
        } else if (status === 400 || status === 401 || status === 422) {
          message = 'Invalid username or password. Please try again.';
        }
      }
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  logout: async () => {
    try {
      await authApi.logout();
    } finally {
      set({ user: null, isAuthenticated: false });
    }
  },

  checkSession: async () => {
    // Only show loading spinner on initial check, not on re-validation
    const wasAuthenticated = get().isAuthenticated;
    if (!wasAuthenticated) set({ isLoading: true });
    try {
      const user = await authApi.me();
      set({ user, isAuthenticated: true, isLoading: false });
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  clearError: () => set({ error: null }),

  sessionExpired: () => set({ user: null, isAuthenticated: false, isLoading: false }),

  updateUser: (updates) =>
    set((state) => ({
      user: state.user ? { ...state.user, ...updates } : null,
    })),
}));