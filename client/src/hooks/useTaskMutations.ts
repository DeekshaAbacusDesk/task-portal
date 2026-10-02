import { useMutation, useQueryClient } from '@tanstack/react-query';
import { tasksApi } from '../api/tasks.api';
import type { ApiError } from '../api/apiError';
import type { Task, TaskChanges, TaskInput, TaskStatus } from '../types/task';
import { moveTaskOnBoard, patchTaskInLists, refreshAfterWrite, restoreSnapshot, taskKeys } from './taskCache';

export function useCreateTask() {
  const queryClient = useQueryClient();
  return useMutation<Task, ApiError, TaskInput>({
    mutationFn: tasksApi.create,
    onSuccess: () => refreshAfterWrite(queryClient),
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  return useMutation<Task, ApiError, { id: string; changes: TaskChanges }>({
    mutationFn: ({ id, changes }) => tasksApi.update(id, changes),
    onSuccess: (task) => {
      patchTaskInLists(queryClient, task);
      return refreshAfterWrite(queryClient);
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();
  return useMutation<void, ApiError, string>({
    mutationFn: tasksApi.remove,
    onSuccess: () => refreshAfterWrite(queryClient),
  });
}

/**
 * Status change from the board (drag and drop or the card menu). Optimistic: the card moves columns
 * immediately and snaps back if the server rejects it; the server's answer then refreshes every view.
 */
export function useMoveTask() {
  const queryClient = useQueryClient();
  return useMutation<Task, ApiError, { task: Task; status: TaskStatus }, { snapshot: ReturnType<typeof moveTaskOnBoard> }>({
    mutationFn: ({ task, status }) => tasksApi.update(task.id, { status }),
    onMutate: async ({ task, status }) => {
      // Stop in-flight column fetches from overwriting the optimistic move.
      await queryClient.cancelQueries({ queryKey: taskKeys.boards() });
      return { snapshot: moveTaskOnBoard(queryClient, task, status) };
    },
    onError: (_error, _vars, context) => {
      if (context) restoreSnapshot(queryClient, context.snapshot);
    },
    onSettled: () => refreshAfterWrite(queryClient),
  });
}
