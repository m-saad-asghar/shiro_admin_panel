'use client';

import * as React from 'react';

export type AuthUser = {
  id: number;
  first_name?: string;
  last_name?: string;
  email?: string;
  roles?: string[];
  permissions?: string[];
  // add more fields if your API returns them
};

export type AuthState = {
  access_token: string | null;
  token_type: string | null;
  expires_at: string | null;
  user: AuthUser | null;
};

type AuthContextValue = AuthState & {
  isAuthenticated: boolean;
  setAuth: (next: AuthState) => void;
  clearAuth: () => void;
};

const STORAGE_KEY = 'admin_auth_v1';

const defaultState: AuthState = {
  access_token: null,
  token_type: null,
  expires_at: null,
  user: null,
};

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined);

function safeParse(json: string | null): AuthState | null {
  if (!json) return null;
  try {
    return JSON.parse(json) as AuthState;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<AuthState>(defaultState);

  // Hydrate from localStorage once on mount
  React.useEffect(() => {
    const saved = safeParse(localStorage.getItem(STORAGE_KEY));
    if (saved?.access_token) setState(saved);
  }, []);

  const setAuth = React.useCallback((next: AuthState) => {
    setState(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    // also keep backward compatibility if you used this key earlier
    if (next.access_token) localStorage.setItem('admin_jwt', next.access_token);
  }, []);

  const clearAuth = React.useCallback(() => {
    setState(defaultState);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('admin_jwt');
  }, []);

  const value: AuthContextValue = React.useMemo(
    () => ({
      ...state,
      isAuthenticated: Boolean(state.access_token),
      setAuth,
      clearAuth,
    }),
    [state, setAuth, clearAuth]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}