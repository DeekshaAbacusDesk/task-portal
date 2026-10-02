import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { tasksApi } from '../api/tasks.api';
import type { ApiError } from '../api/apiError';
import type { TaskListParams, TaskPage } from '../types/task';
import { taskKeys } from './taskCache';

export function useTasks(params: TaskListParams) {
  return useQuery<TaskPage, ApiError>({
    queryKey: taskKeys.list(params),
    queryFn: () => tasksApi.list(params),
    // Keep the current page on screen while the next page/filter loads — no flash of skeletons.
    placeholderData: keepPreviousData,
  });
}
