import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { Language, t } from './i18n';
import * as store from './storage';
import { AuthUser } from './storage';

interface AppContextValue {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  t: (key: string) => string;
  onboardingDone: boolean;
  completeOnboarding: () => Promise<void>;
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
      const lang = await store.getLanguage();
      const done = await store.isOnboardingDone();
      const authUser = await store.getAuthUser();
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

  const translate = (key: string) => t(language, key);

  const value = useMemo(() => ({
    language,
    setLanguage,
    t: translate,
    onboardingDone,
    completeOnboarding,
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
