// ============================================================
// 🏪 AUTH STORE — Zustand state for authentication
// ============================================================

import { create } from 'zustand';
import type { UserProfile, UserRole } from '../lib/types';
import type { AuthUser } from '../lib/auth';

interface AuthState {
  user: AuthUser | null;
  profile: UserProfile | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  profilePromptCount: number; // Track profile update prompt count

  // Actions
  setUser: (user: AuthUser | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  setRole: (role: UserRole | null) => void;
  setLoading: (loading: boolean) => void;
  incrementProfilePrompt: () => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profile: null,
  role: null,
  isAuthenticated: false,
  isLoading: true,
  profilePromptCount: 0,

  setUser: (user) =>
    set({
      user,
      isAuthenticated: !!user,
    }),

  setProfile: (profile) =>
    set({
      profile,
      role: profile?.role ?? null,
    }),

  setRole: (role) => set({ role }),

  setLoading: (isLoading) => set({ isLoading }),

  incrementProfilePrompt: () =>
    set((state) => ({
      profilePromptCount: state.profilePromptCount + 1,
    })),

  logout: () =>
    set({
      user: null,
      profile: null,
      role: null,
      isAuthenticated: false,
      profilePromptCount: 0,
    }),
}));
