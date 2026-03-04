'use client';

import * as React from 'react';
import usersImagesUrl from '@/helpers/usersImagesURL';

const DEFAULT_AVATAR_FILE = "default_user.avif";

function resolveProfileImage(profileImage: unknown): string {
  if (typeof profileImage === "string" && profileImage.trim() !== "") {
    return usersImagesUrl(profileImage);
  }

  return usersImagesUrl(DEFAULT_AVATAR_FILE);
}

export type AuthUser = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  roles: string[];
  permissions: string[];
  profile_image?: string | null;
};

export type LoginResponse = {
  token_type?: string;
  access_token?: string;
  token?: string;
  expires_at?: string;
  message?: string;
  error?: string;
  errors?: Record<string, string[]>;
  user?: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    roles?: string[];
    permissions?: string[];
    profile_image?: string | null;
  };
};

type SignInArgs = {
  token: string;
  user: AuthUser | null;
  raw?: LoginResponse;
};

export type UserContextValue = {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (args: SignInArgs) => void;
  signOut: () => void;
  hydrateFromStorage: () => void;
};

const UserContext = React.createContext<UserContextValue | undefined>(undefined);

function safeJsonParse<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function normalizeUser(u: AuthUser | null): AuthUser | null {
  if (!u) return null;

  return {
    ...u,
    roles: Array.isArray(u.roles) ? u.roles : [],
    permissions: Array.isArray(u.permissions) ? u.permissions : [],
    profile_image: resolveProfileImage(u.profile_image),
  };
}

export function UserProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const [user, setUser] = React.useState<AuthUser | null>(null);
  const [token, setToken] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);

  const hydrateFromStorage = React.useCallback(() => {
    const storedToken = localStorage.getItem('admin_jwt');
    const storedUser = safeJsonParse<AuthUser>(localStorage.getItem('admin_user'));

    setToken(storedToken);
    setUser(normalizeUser(storedUser));
  }, []);

  React.useEffect(() => {
    hydrateFromStorage();
    setIsLoading(false);
  }, [hydrateFromStorage]);

  const signIn = React.useCallback((args: SignInArgs) => {
    const fixedUser = normalizeUser(args.user);

    setToken(args.token);
    setUser(fixedUser);

    localStorage.setItem('admin_jwt', args.token);
    localStorage.setItem('admin_user', JSON.stringify(fixedUser));

    if (args.raw) {
      localStorage.setItem('admin_login_payload', JSON.stringify(args.raw));
    }
  }, []);

  const signOut = React.useCallback(() => {
    setToken(null);
    setUser(null);

    localStorage.removeItem('admin_jwt');
    localStorage.removeItem('admin_user');
    localStorage.removeItem('admin_login_payload');
  }, []);

  const value: UserContextValue = React.useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token),
      isLoading,
      signIn,
      signOut,
      hydrateFromStorage,
    }),
    [user, token, isLoading, signIn, signOut, hydrateFromStorage]
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUserContext(): UserContextValue {
  const ctx = React.useContext(UserContext);
  if (!ctx) {
    throw new Error('useUserContext must be used inside <UserProvider>.');
  }
  return ctx;
}