'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';

import { paths } from '@/paths';
import { logger } from '@/lib/default-logger';
import { useUser } from '@/hooks/use-user';

export interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps): React.JSX.Element | null {
  const router = useRouter();
  const { user, isLoading } = useUser();
  const [isChecking, setIsChecking] = React.useState<boolean>(true);

  React.useEffect(() => {
    // Wait until user loading is finished
    if (isLoading) return;

    // Not logged in -> redirect
    if (!user) {
      logger.debug('[AuthGuard]: User is not logged in, redirecting to sign in');
      router.replace(paths.auth.signIn);
      return;
    }

    // Logged in -> allow render
    setIsChecking(false);
  }, [user, isLoading, router]);

  if (isChecking) {
    return null;
  }

  return <>{children}</>;
}