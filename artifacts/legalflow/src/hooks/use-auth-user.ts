import { useGetCurrentUser, useSyncCurrentUser } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { useUser } from '@clerk/react';
import { useEffect, useRef } from 'react';

export interface ServerUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
  firmName: string | null;
  initials: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UseAuthUserReturn {
  user: ServerUser | null;
  isLoading: boolean;
  error: Error | null;
}

export function useAuthUser(): UseAuthUserReturn {
  const { user, isLoaded } = useUser();
  const qc = useQueryClient();
  // Track whether a sync is currently in-flight or has already succeeded,
  // but reset on error so we can retry if the first attempt failed (e.g.
  // Clerk session temporarily unavailable during first render).
  const syncedRef = useRef(false);

  const {
    data: serverUser,
    isLoading: serverLoading,
    error,
  } = useGetCurrentUser({
    query: { queryKey: ['currentUser'] },
  });

  const sync = useSyncCurrentUser({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ['currentUser'] });
      },
    },
  });

  useEffect(() => {
    if (!isLoaded || !user || syncedRef.current) return;

    const email = user.primaryEmailAddress?.emailAddress;
    if (!email) return;

    // Mark as in-flight BEFORE the call so concurrent renders don't
    // fire duplicate requests.
    syncedRef.current = true;

    const name = user.fullName || user.firstName || null;
    const initials = name
      ? name
          .split(' ')
          .map((n) => n[0])
          .filter(Boolean)
          .slice(0, 2)
          .join('')
          .toUpperCase()
      : null;

    sync.mutate(
      { data: { email, name, initials } },
      {
        onError: () => {
          // Allow retry on next render cycle if sync failed (e.g. transient
          // Clerk session issue prevented the server from authenticating the
          // request).
          syncedRef.current = false;
        },
      },
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, user?.id]);

  return {
    user: serverUser
      ? ({
          id: serverUser.id,
          email: serverUser.email,
          name: serverUser.name || null,
          role: serverUser.role,
          firmName: serverUser.firmName || null,
          initials: serverUser.initials || null,
          createdAt: serverUser.createdAt,
          updatedAt: serverUser.updatedAt,
        } as ServerUser)
      : null,
    isLoading: serverLoading || !isLoaded,
    error: error instanceof Error ? error : null,
  };
}
