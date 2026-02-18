import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { Language, t } from './i18n';
import * as store from './storage';
import { getSession, type AuthUser } from './auth';

interface AppContextValue {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  t: (key: string) => string;
  onboardingDone: boolean;
  completeOnboarding: () => Promise<void>;
  resetOnboarding: () => Promise<void>;
  isReady: boolean;
  user: AuthUser | null;
  setUser: (user: AuthUser | null) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [language, setLang] = useState<Language>('en');
  const [onboardingDone, setOnboardingDone] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    (async () => {
      // Initialise SQLite DB + run one-time AsyncStorage migration
      await store.initDatabase();
      const lang = await store.getLanguage();
      const done = await store.isOnboardingDone();
      // Use secure session storage from auth service
      const authUser = await getSession();
      setLang(lang);
      setOnboardingDone(done);
      setUser(authUser);
      setIsReady(true);
    })();
  }, []);

  const setLanguage = async (lang: Language) => {
    setLang(lang);
    await store.setLanguage(lang);
  };

  const completeOnboarding = async () => {
    setOnboardingDone(true);
    await store.setOnboardingDone();
  };

  const resetOnboarding = async () => {
    setOnboardingDone(false);
    await store.resetOnboardingDone();
  };

  const translate = (key: string) => t(language, key);

  const value = useMemo(() => ({
    language,
    setLanguage,
    t: translate,
    onboardingDone,
    completeOnboarding,
    resetOnboarding,
    isReady,
    user,
    setUser,
  }), [language, onboardingDone, isReady, user]);

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}
