import { useInfiniteQuery } from '@tanstack/react-query';
import { tasksApi } from '../api/tasks.api';
import type { ApiError } from '../api/apiError';
import type { TaskPage, TaskStatus } from '../types/task';
import { taskKeys } from './taskCache';

const COLUMN_PAGE_SIZE = 20;

/**
 * One board column = one status, paged independently with "Load more", so a large Completed column
 * never delays Pending. Reuses the list endpoint (status + search filters), no board-specific API.
 */
export function useBoardColumn(status: TaskStatus, search: string) {
  return useInfiniteQuery<TaskPage, ApiError, { pages: TaskPage[] }, ReturnType<typeof taskKeys.boardColumn>, number>({
    queryKey: taskKeys.boardColumn(status, search),
    queryFn: ({ pageParam }) =>
      tasksApi.list({ page: pageParam, limit: COLUMN_PAGE_SIZE, status, search: search || undefined }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined),
  });
}
