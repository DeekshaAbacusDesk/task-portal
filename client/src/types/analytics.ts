import type { Task, TaskStatus } from './task';

export interface DailyCount {
  /** UTC calendar day, YYYY-MM-DD */
  date: string;
  count: number;
}

export interface AnalyticsSummary {
  total: number;
  byStatus: Record<TaskStatus, number>;
  /** 0–1 */
  completionRate: number;
  createdPerDay: DailyCount[];
  recentlyUpdated: Task[];
}
