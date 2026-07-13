import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  useListClients,
  useCreateClient,
  useUpdateClient,
  useDeleteClient,
  analyzeIntake,
  type ClientInput,
  type ClientStatus,
} from '@workspace/api-client-react';
import { useToast } from '@/hooks/use-toast';
import { useSettings } from '@/hooks/use-settings';
import { useProfile } from '@/hooks/use-profile';
import {
  runCreateClientAutomation,
  recordStatusChange,
  recordClientUpdate,
  recordClientDelete,
  type AutomationResult,
} from '@/lib/automation';
import type { AiAnalysis, ClientWithAi } from '@/types';

function parseAiSummary(value: string | null | undefined): AiAnalysis | undefined {
  if (!value) return undefined;
  try {
    return JSON.parse(value) as AiAnalysis;
  } catch {
    return undefined;
  }
}

export interface UseClientsReturn {
  clients: ClientWithAi[];
  isLoading: boolean;
  createClient: (input: ClientInput, analysis?: AiAnalysis) => Promise<AutomationResult | null>;
  updateClient: (id: string, input: ClientInput) => Promise<boolean>;
  changeStatus: (id: string, status: ClientStatus) => Promise<boolean>;
  removeClient: (id: string) => Promise<boolean>;
  getById: (id: string) => { id: string; name: string } | undefined;
  reload: () => void;
}

export function useClients(): UseClientsReturn {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { settings } = useSettings();
  const { telegramEnabled } = useProfile();

  const { data: rawClients, isLoading } = useListClients({
    query: { queryKey: ['clients'] },
  });
  const clients = (rawClients ?? []) as ClientWithAi[];

  const createMutation = useCreateClient({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ['clients'] });
        qc.invalidateQueries({ queryKey: ['activities'] });
      },
      onError: (err: Error) => {
        toast({ title: 'Ошибка', description: err.message, variant: 'destructive' });
      },
    },
  });

  const updateMutation = useUpdateClient({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ['clients'] });
        qc.invalidateQueries({ queryKey: ['activities'] });
      },
      onError: (err: Error) => {
        toast({ title: 'Ошибка', description: err.message, variant: 'destructive' });
      },
    },
  });

  const deleteMutation = useDeleteClient({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ['clients'] });
        qc.invalidateQueries({ queryKey: ['activities'] });
      },
      onError: (err: Error) => {
        toast({ title: 'Ошибка', description: err.message, variant: 'destructive' });
      },
    },
  });

  const createClient = useCallback(
    async (input: ClientInput, analysis?: AiAnalysis): Promise<AutomationResult | null> => {
      try {
        const aiSummary = analysis ?? (await analyzeIntake({ description: input.description ?? '' }));
        const created = await createMutation.mutateAsync({
          data: {
            ...input,
            aiSummary: typeof aiSummary === 'string' ? aiSummary : JSON.stringify(aiSummary),
          },
        });
        const client = {
          ...created,
          email: created.email ?? undefined,
          phone: created.phone ?? '',
          aiSummary: parseAiSummary(created.aiSummary),
        } as unknown as ClientWithAi;
        return await runCreateClientAutomation(client, settings, telegramEnabled, analysis);
      } catch {
        return null;
      }
    },
    [createMutation, settings, telegramEnabled],
  );

  const updateClient = useCallback(
    async (id: string, input: ClientInput): Promise<boolean> => {
      try {
        await updateMutation.mutateAsync({ clientId: id, data: input });
        void recordClientUpdate(id, input.name);
        return true;
      } catch {
        return false;
      }
    },
    [updateMutation],
  );

  const changeStatus = useCallback(
    async (id: string, status: ClientStatus): Promise<boolean> => {
      try {
        await updateMutation.mutateAsync({ clientId: id, data: { status } as ClientInput });
        const clientName = clients?.find((c) => c.id === id)?.name ?? '';
        void recordStatusChange(id, status, clientName);
        return true;
      } catch {
        return false;
      }
    },
    [updateMutation, clients],
  );

  const removeClient = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        const clientName = clients?.find((c) => c.id === id)?.name ?? '';
        await deleteMutation.mutateAsync({ clientId: id });
        void recordClientDelete(id, clientName);
        return true;
      } catch {
        return false;
      }
    },
    [deleteMutation, clients],
  );

  const getById = useCallback(
    (id: string) => {
      return clients?.find((c) => c.id === id);
    },
    [clients],
  );

  const reload = useCallback(() => {
    qc.invalidateQueries({ queryKey: ['clients'] });
  }, [qc]);

  return {
    clients,
    isLoading,
    createClient,
    updateClient,
    changeStatus,
    removeClient,
    getById,
    reload,
  };
}
