export const TASK_STATUSES = ['pending', 'in-progress', 'completed'] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];

export const STATUS_LABELS: Record<TaskStatus, string> = {
  pending: 'Pending',
  'in-progress': 'In Progress',
  completed: 'Completed',
};

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  /** Calendar day, YYYY-MM-DD */
  dueDate: string | null;
  /** ISO timestamp, set by the server when the task is completed */
  completedAt: string | null;
  /** ISO timestamp; shown as "Assigned on" */
  createdAt: string;
  updatedAt: string;
}

export interface TaskListParams {
  page: number;
  limit: number;
  status?: TaskStatus;
  search?: string;
}

export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export type StatusCounts = Record<TaskStatus, number> & { all: number };

export interface TaskPage {
  data: Task[];
  meta: PageMeta & { statusCounts: StatusCounts };
}

export interface TaskInput {
  title: string;
  description: string;
  status: TaskStatus;
  dueDate: string | null;
}

export type TaskChanges = Partial<TaskInput>;

export type TaskView = 'list' | 'board';
