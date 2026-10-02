export const TASK_STATUSES = ['pending', 'in-progress', 'completed'] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  /** Calendar day the task is due, YYYY-MM-DD (no time zone — a deadline is a date, not an instant). */
  dueDate: string | null;
  /** When the task entered "completed"; server-managed, cleared if the task is reopened. */
  completedAt: string | null;
  /** When the task was created/assigned. */
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskInput {
  title: string;
  description: string;
  status: TaskStatus;
  dueDate: string | null;
}

export type UpdateTaskInput = Partial<CreateTaskInput>;

export interface TaskQuery {
  page: number;
  limit: number;
  status?: TaskStatus;
  search?: string;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface TaskListResult extends Paginated<Task> {
  /** Per-status totals for the current search (ignoring the status filter) — powers the tab counts. */
  statusCounts: Record<TaskStatus, number> & { all: number };
}
