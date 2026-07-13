import { useCallback } from 'react';
import { useListActivities } from '@workspace/api-client-react';
import type { ActivityRecord } from '@/types';

export interface UseActivitiesReturn {
  activities: ActivityRecord[];
  isLoading: boolean;
  reload: () => void;
}

export function useActivities(clientId?: string): UseActivitiesReturn {
  const { data: rawActivities, isLoading, refetch } = useListActivities({
    query: { queryKey: ['activities', clientId] },
  });
  const activities = (rawActivities ?? []) as ActivityRecord[];

  const reload = useCallback(() => {
    refetch();
  }, [refetch]);

  const filtered = clientId
    ? activities.filter((a) => a.clientId === clientId)
    : activities;

  return {
    activities: filtered,
    isLoading,
    reload,
  };
}
