import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { analyticsKeys } from '../hooks/useAnalytics';
import { patchTaskInLists, refreshTaskLists } from '../hooks/taskCache';
import { useAuth } from '../hooks/useAuth';
import type { Task } from '../types/task';
import { createSocket, SOCKET_EVENTS } from './socket';

/** Events arriving within this window collapse into one refetch (e.g. a bulk import or a busy team). */
const COALESCE_MS = 250;

/**
 * Keeps the TanStack Query cache in sync with server-pushed events:
 *  - task updated        → patch it in place wherever it is cached (instant, no request)
 *  - status changed      → refetch lists, since it may now belong under a different filter / tab count
 *  - created / deleted   → refetch lists, since page membership and totals changed
 *  - any task event      → refetch analytics, whose aggregates depend on every task
 * Refetches are coalesced, so a burst of N events costs one request per query, not N.
 * Handlers are idempotent, so receiving our own changes back is harmless.
 * Mounted once for the authenticated app, so every page shares a single connection.
 */
export function useTaskRealtime(): void {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!token) return;

    const socket = createSocket(token);
    const pending = { lists: false, analytics: false };
    let timer: ReturnType<typeof setTimeout> | null = null;

    const schedule = (what: { lists?: boolean; analytics?: boolean }) => {
      pending.lists ||= Boolean(what.lists);
      pending.analytics ||= Boolean(what.analytics);
      if (timer) return;
      timer = setTimeout(() => {
        timer = null;
        if (pending.lists) void refreshTaskLists(queryClient);
        if (pending.analytics) void queryClient.invalidateQueries({ queryKey: analyticsKeys.all });
        pending.lists = pending.analytics = false;
      }, COALESCE_MS);
    };
    const refreshAll = () => schedule({ lists: true, analytics: true });

    socket.on(SOCKET_EVENTS.taskUpdated, (task: Task) => {
      patchTaskInLists(queryClient, task);
      schedule({ analytics: true });
    });
    socket.on(SOCKET_EVENTS.taskStatusChanged, refreshAll);
    socket.on(SOCKET_EVENTS.taskCreated, refreshAll);
    socket.on(SOCKET_EVENTS.taskDeleted, refreshAll);
    // Catch up on anything missed while disconnected.
    socket.io.on('reconnect', refreshAll);

    return () => {
      if (timer) clearTimeout(timer);
      socket.io.off('reconnect', refreshAll);
      socket.disconnect();
    };
  }, [token, queryClient]);
}
