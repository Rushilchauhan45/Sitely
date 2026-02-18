// ============================================================
// 🏪 SETTINGS STORE — Zustand state for app settings
// ============================================================

import { create } from 'zustand';
import type { Language } from '../lib/i18n';

interface SettingsState {
  language: Language;
  onboardingCompleted: boolean;
  notificationsEnabled: boolean;

  // Actions
  setLanguage: (lang: Language) => void;
  setOnboardingCompleted: (done: boolean) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  language: 'en',
  onboardingCompleted: false,
  notificationsEnabled: false,

  setLanguage: (language) => set({ language }),
  setOnboardingCompleted: (onboardingCompleted) => set({ onboardingCompleted }),
  setNotificationsEnabled: (notificationsEnabled) => set({ notificationsEnabled }),
}));
