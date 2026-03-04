'use client';

import * as React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { paths } from '@/paths';

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();

  React.useEffect(() => {
    if (!isAuthenticated) {
      // optional: preserve where user wanted to go
      const next = encodeURIComponent(pathname || paths.dashboard.overview);
      router.replace(`${paths.auth.signIn}?next=${next}`);
    }
  }, [isAuthenticated, router, pathname]);

  if (!isAuthenticated) return null; // or a loader
  return <>{children}</>;
}