import type { Task, TaskQuery, TaskStatus } from '../domain/task.js';

/**
 * Persistence contract for tasks. Services depend on this interface only, so moving from
 * in-memory to Postgres/DynamoDB is a new implementation, not a service rewrite.
 * Filtering and pagination live here so a real database can push them into the query.
 */
export interface TaskRepository {
  create(task: Task): Promise<Task>;
  findById(id: string): Promise<Task | null>;
  findMany(query: TaskQuery): Promise<{ items: Task[]; total: number }>;
  update(id: string, changes: Partial<Omit<Task, 'id' | 'createdAt'>>): Promise<Task | null>;
  delete(id: string): Promise<boolean>;

  // Aggregates — a SQL implementation maps these to GROUP BY queries instead of scanning.
  countByStatus(filter?: { search?: string }): Promise<Record<TaskStatus, number>>;
  /** Count of tasks per UTC day (YYYY-MM-DD) created at or after `since`. Days with no tasks are omitted. */
  countCreatedPerDay(since: Date): Promise<Map<string, number>>;
  findRecentlyUpdated(limit: number): Promise<Task[]>;
}
