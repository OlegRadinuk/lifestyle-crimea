'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

export type HeaderMode = 'hero' | 'dark' | 'apartment';

type Section = {
  mode: HeaderMode;
  priority: number;
};

type SectionsMap = Record<string, Section>;

type HeaderContextValue = {
  mode: HeaderMode;
  register: (id: string, section: Section) => void;
  unregister: (id: string) => void;
};

const HeaderContext = createContext<HeaderContextValue | null>(null);

export function HeaderProvider({ children }: { children: React.ReactNode }) {
  const [sections, setSections] = useState<SectionsMap>({});

  const register = useCallback((id: string, section: Section) => {
    setSections(prev => {
      const existing = prev[id];

      if (
        existing &&
        existing.mode === section.mode &&
        existing.priority === section.priority
      ) {
        return prev;
      }

      return {
        ...prev,
        [id]: section,
      };
    });
  }, []);

  const unregister = useCallback((id: string) => {
    setSections(prev => {
      if (!prev[id]) return prev;

      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  const mode = useMemo<HeaderMode>(() => {
    const active = Object.values(sections);

    if (!active.length) {
      return 'hero';
    }

    return active
      .slice()
      .sort((a, b) => b.priority - a.priority)[0]
      .mode;
  }, [sections]);

  const value = useMemo(
    () => ({
      mode,
      register,
      unregister,
    }),
    [mode, register, unregister]
  );

  return (
    <HeaderContext.Provider value={value}>
      {children}
    </HeaderContext.Provider>
  );
}

export function useHeader() {
  const ctx = useContext(HeaderContext);
  if (!ctx) {
    throw new Error('useHeader must be used within HeaderProvider');
  }
  return ctx;
}
