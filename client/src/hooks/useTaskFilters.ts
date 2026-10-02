import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { TASK_STATUSES, type TaskStatus, type TaskView } from '../types/task';

function isTaskStatus(value: string | null): value is TaskStatus {
  return value !== null && (TASK_STATUSES as readonly string[]).includes(value);
}

/**
 * Filters live in the URL (?view=&status=&q=&page=) so views are shareable, survive refresh,
 * and work with the browser's back button. Changing a filter always resets to page 1.
 */
export function useTaskFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = useMemo(() => {
    const page = Number.parseInt(searchParams.get('page') ?? '1', 10);
    const status = searchParams.get('status');
    const view: TaskView = searchParams.get('view') === 'board' ? 'board' : 'list';
    return {
      view,
      page: Number.isFinite(page) && page > 0 ? page : 1,
      // The board shows every status as a column, so a status filter only applies to the list.
      status: view === 'list' && isTaskStatus(status) ? status : undefined,
      search: searchParams.get('q') ?? '',
    };
  }, [searchParams]);

  const update = useCallback(
    (changes: Record<string, string | undefined>, options?: { replace?: boolean }) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        for (const [key, value] of Object.entries(changes)) {
          if (value) next.set(key, value);
          else next.delete(key);
        }
        return next;
      }, options);
    },
    [setSearchParams],
  );

  const setStatus = useCallback((status?: TaskStatus) => update({ status, page: undefined }), [update]);
  // Replace (not push) so each debounced keystroke doesn't add a history entry.
  const setSearch = useCallback((q: string) => update({ q: q.trim(), page: undefined }, { replace: true }), [update]);
  const setPage = useCallback((page: number) => update({ page: page > 1 ? String(page) : undefined }), [update]);
  const clear = useCallback(() => update({ status: undefined, q: undefined, page: undefined }), [update]);
  // Search carries over between views; list-only state (status tab, page) does not.
  const setView = useCallback(
    (view: TaskView) => update({ view: view === 'board' ? 'board' : undefined, status: undefined, page: undefined }),
    [update],
  );

  return {
    ...filters,
    hasFilters: Boolean(filters.status || filters.search),
    setStatus,
    setSearch,
    setPage,
    setView,
    clear,
  };
}
