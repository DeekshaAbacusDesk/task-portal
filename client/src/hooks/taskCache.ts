import type { InfiniteData, QueryClient, QueryKey } from '@tanstack/react-query';
import type { Task, TaskListParams, TaskPage, TaskStatus } from '../types/task';
import { analyticsKeys } from './useAnalytics';

/** Query-key factory: one source of truth so invalidation can target "every task list" precisely. */
export const taskKeys = {
  all: ['tasks'] as const,
  lists: () => [...taskKeys.all, 'list'] as const,
  list: (params: TaskListParams) => [...taskKeys.lists(), params] as const,
  // Board columns live under lists(), so every list invalidation refreshes them too.
  boards: () => [...taskKeys.lists(), 'board'] as const,
  boardColumn: (status: TaskStatus, search: string) => [...taskKeys.boards(), status, search] as const,
};

type ListCache = TaskPage | InfiniteData<TaskPage, number>;

function isInfinite(data: ListCache): data is InfiniteData<TaskPage, number> {
  return 'pages' in data;
}

/** Apply `fn` to every page of a cached list, whether it is a plain page (list view) or infinite (board column). */
function mapPages(data: ListCache | undefined, fn: (page: TaskPage) => TaskPage): ListCache | undefined {
  if (!data) return data;
  return isInfinite(data) ? { ...data, pages: data.pages.map(fn) } : fn(data);
}

/** Replace a task in every cached page that contains it — instant UI update, no refetch. */
export function patchTaskInLists(queryClient: QueryClient, task: Task): void {
  queryClient.setQueriesData<ListCache>({ queryKey: taskKeys.lists() }, (data) =>
    mapPages(data, (page) =>
      page.data.some((t) => t.id === task.id)
        ? { ...page, data: page.data.map((t) => (t.id === task.id ? task : t)) }
        : page,
    ),
  );
}

/**
 * Optimistically move a task between board columns: drop it from every column, then put it at the
 * top of its new status's column. Returns a snapshot so the caller can roll back on failure.
 */
export function moveTaskOnBoard(queryClient: QueryClient, task: Task, status: TaskStatus): Array<[QueryKey, unknown]> {
  const snapshot = queryClient.getQueriesData({ queryKey: taskKeys.boards() });
  const moved: Task = { ...task, status };

  for (const [key] of snapshot) {
    const columnStatus = key[3] as TaskStatus;
    queryClient.setQueryData<InfiniteData<TaskPage, number>>(key, (data) => {
      if (!data) return data;
      const pages = data.pages.map((page, i) => {
        const without = page.data.filter((t) => t.id !== task.id);
        const removed = page.data.length - without.length;
        const items = columnStatus === status && i === 0 ? [moved, ...without] : without;
        const delta = (columnStatus === status && i === 0 ? 1 : 0) - removed;
        return { ...page, data: items, meta: { ...page.meta, total: Math.max(0, page.meta.total + delta) } };
      });
      return { ...data, pages };
    });
  }
  return snapshot;
}

export function restoreSnapshot(queryClient: QueryClient, snapshot: Array<[QueryKey, unknown]>): void {
  for (const [key, data] of snapshot) queryClient.setQueryData(key, data);
}

/**
 * Refetch task lists. Used when list membership may change (create, delete, status change under a
 * filter): the server is the source of truth for which tasks belong on which page.
 */
export function refreshTaskLists(queryClient: QueryClient): Promise<void> {
  return queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
}

/**
 * After this client's own write: refresh lists and analytics directly, so the UI is correct
 * even if the socket is momentarily disconnected (the socket echo is then a cheap no-op refetch).
 */
export function refreshAfterWrite(queryClient: QueryClient): Promise<unknown> {
  return Promise.all([refreshTaskLists(queryClient), queryClient.invalidateQueries({ queryKey: analyticsKeys.all })]);
}
