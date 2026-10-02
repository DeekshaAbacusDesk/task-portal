import type { Task, TaskStatus } from './task.js';

export interface DailyCount {
  /** UTC calendar day, YYYY-MM-DD */
  date: string;
  count: number;
}

export interface AnalyticsSummary {
  total: number;
  byStatus: Record<TaskStatus, number>;
  /** completed / total, 0–1. 0 when there are no tasks. */
  completionRate: number;
  /** One entry per day for the requested window, oldest first, zero-filled. */
  createdPerDay: DailyCount[];
  recentlyUpdated: Task[];
}
