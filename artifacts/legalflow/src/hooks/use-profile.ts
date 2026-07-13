import {
  useGetCurrentUser,
  useSyncCurrentUser,
  useUpdateUserTelegram,
  useTestTelegram,
  type TelegramResult,
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { useUser } from '@clerk/react';
import { useCallback } from 'react';

export const DEFAULT_PROFILE = {
  name: 'Адвокат',
  email: 'user@legalflow.local',
  role: 'lawyer',
  initials: 'АП',
  firmName: 'LegalFlow',
};

export interface UseProfileReturn {
  profile: {
    name: string;
    email: string;
    role: string;
    initials: string;
    firmName: string;
  };
  updateProfile: (data: { name?: string; email?: string; initials?: string; firmName?: string }) => void;
  isLoading: boolean;
  telegramChatId: string | null;
  telegramEnabled: boolean;
  connectTelegram: (chatId: string) => Promise<void>;
  disconnectTelegram: () => Promise<void>;
  testTelegram: () => Promise<TelegramResult>;
  isConnectingTelegram: boolean;
}

export function useProfile(): UseProfileReturn {
  const qc = useQueryClient();
  const { user: clerkUser } = useUser();

  const { data: user, isLoading } = useGetCurrentUser({
    query: { queryKey: ['currentUser'] },
  });

  const sync = useSyncCurrentUser({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ['currentUser'] });
      },
    },
  });

  const updateTelegram = useUpdateUserTelegram({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ['currentUser'] });
      },
    },
  });

  const testTelegramMutation = useTestTelegram();

  const profile = {
    name: user?.name || DEFAULT_PROFILE.name,
    email: user?.email || DEFAULT_PROFILE.email,
    role: user?.role || DEFAULT_PROFILE.role,
    initials: user?.initials || DEFAULT_PROFILE.initials,
    firmName: user?.firmName || DEFAULT_PROFILE.firmName,
  };

  const updateProfile = useCallback(
    (data: { name?: string; email?: string; initials?: string; firmName?: string }) => {
      const name = data.name ?? clerkUser?.fullName ?? profile.name;
      const initials =
        data.initials ??
        (name
          ? name
              .split(' ')
              .map((n) => n[0])
              .filter(Boolean)
              .slice(0, 2)
              .join('')
              .toUpperCase()
          : profile.initials);

      sync.mutate({
        data: {
          email: data.email ?? profile.email,
          name,
          initials,
          firmName: data.firmName ?? profile.firmName,
        },
      });
    },
    [sync, profile, clerkUser],
  );

  const connectTelegram = useCallback(
    async (chatId: string) => {
      await updateTelegram.mutateAsync({
        data: { telegramChatId: chatId, telegramNotificationsEnabled: true },
      });
    },
    [updateTelegram],
  );

  const disconnectTelegram = useCallback(async () => {
    await updateTelegram.mutateAsync({
      data: { telegramChatId: null, telegramNotificationsEnabled: false },
    });
  }, [updateTelegram]);

  const testTelegram = useCallback(async () => {
    return testTelegramMutation.mutateAsync();
  }, [testTelegramMutation]);

  return {
    profile,
    updateProfile,
    isLoading,
    telegramChatId: user?.telegramChatId ?? null,
    telegramEnabled: !!user?.telegramNotificationsEnabled,
    connectTelegram,
    disconnectTelegram,
    testTelegram,
    isConnectingTelegram: updateTelegram.isPending,
  };
}
