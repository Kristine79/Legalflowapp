import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  useListTasks,
  useCreateTask,
  useUpdateTask,
  useDeleteTask,
  useUpdateTaskStatus,
  type Task,
  type TaskInput,
  type TaskStatus,
} from '@workspace/api-client-react';
import { useToast } from '@/hooks/use-toast';

export interface UseTasksReturn {
  tasks: Task[];
  isLoading: boolean;
  createTask: (input: TaskInput) => Promise<boolean>;
  updateTask: (id: string, input: TaskInput) => Promise<boolean>;
  deleteTask: (id: string) => Promise<boolean>;
  toggleStatus: (task: Task) => Promise<boolean>;
  reload: () => void;
}

export function useTasks(): UseTasksReturn {
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: rawTasks, isLoading } = useListTasks({
    query: { queryKey: ['tasks'] },
  });
  const tasks = (rawTasks ?? []) as Task[];

  const invalidate = () => qc.invalidateQueries({ queryKey: ['tasks'] });

  const createMutation = useCreateTask({
    mutation: {
      onSuccess: invalidate,
      onError: (err: Error) => {
        toast({ title: 'Ошибка', description: err.message, variant: 'destructive' });
      },
    },
  });

  const updateMutation = useUpdateTask({
    mutation: {
      onSuccess: invalidate,
      onError: (err: Error) => {
        toast({ title: 'Ошибка', description: err.message, variant: 'destructive' });
      },
    },
  });

  const deleteMutation = useDeleteTask({
    mutation: {
      onSuccess: invalidate,
      onError: (err: Error) => {
        toast({ title: 'Ошибка', description: err.message, variant: 'destructive' });
      },
    },
  });

  const statusMutation = useUpdateTaskStatus({
    mutation: {
      onSuccess: invalidate,
      onError: (err: Error) => {
        toast({ title: 'Ошибка', description: err.message, variant: 'destructive' });
      },
    },
  });

  const createTask = useCallback(
    async (input: TaskInput): Promise<boolean> => {
      try {
        await createMutation.mutateAsync({ data: input });
        return true;
      } catch {
        return false;
      }
    },
    [createMutation],
  );

  const updateTask = useCallback(
    async (id: string, input: TaskInput): Promise<boolean> => {
      try {
        await updateMutation.mutateAsync({ taskId: id, data: input });
        return true;
      } catch {
        return false;
      }
    },
    [updateMutation],
  );

  const deleteTask = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        await deleteMutation.mutateAsync({ taskId: id });
        return true;
      } catch {
        return false;
      }
    },
    [deleteMutation],
  );

  const toggleStatus = useCallback(
    async (task: Task): Promise<boolean> => {
      const nextStatus: TaskStatus = task.status === 'done' ? 'pending' : 'done';
      try {
        await statusMutation.mutateAsync({ taskId: task.id, data: { status: nextStatus } });
        return true;
      } catch {
        return false;
      }
    },
    [statusMutation],
  );

  const reload = useCallback(() => {
    invalidate();
  }, [qc]);

  return {
    tasks,
    isLoading,
    createTask,
    updateTask,
    deleteTask,
    toggleStatus,
    reload,
  };
}
