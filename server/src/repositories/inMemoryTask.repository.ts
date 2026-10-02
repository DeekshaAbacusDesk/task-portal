import { TASK_STATUSES, type Task, type TaskQuery, type TaskStatus } from '../domain/task.js';
import type { TaskRepository } from './task.repository.js';

export class InMemoryTaskRepository implements TaskRepository {
  // Map keeps O(1) lookups by id; list queries scan, which is acceptable at in-memory scale.
  private readonly tasks = new Map<string, Task>();

  async create(task: Task): Promise<Task> {
    this.tasks.set(task.id, { ...task });
    return { ...task };
  }

  async findById(id: string): Promise<Task | null> {
    const task = this.tasks.get(id);
    return task ? { ...task } : null;
  }

  async findMany({ page, limit, status, search }: TaskQuery): Promise<{ items: Task[]; total: number }> {
    const matches = this.matching(search)
      .filter((task) => !status || task.status === status)
      // Newest first; id as tie-breaker keeps ordering stable across pages.
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id));

    const start = (page - 1) * limit;
    return {
      items: matches.slice(start, start + limit).map((task) => ({ ...task })),
      total: matches.length,
    };
  }

  async update(id: string, changes: Partial<Omit<Task, 'id' | 'createdAt'>>): Promise<Task | null> {
    const existing = this.tasks.get(id);
    if (!existing) return null;

    const updated: Task = { ...existing, ...changes };
    this.tasks.set(id, updated);
    return { ...updated };
  }

  async delete(id: string): Promise<boolean> {
    return this.tasks.delete(id);
  }

  async countByStatus(filter: { search?: string } = {}): Promise<Record<TaskStatus, number>> {
    const counts = Object.fromEntries(TASK_STATUSES.map((status) => [status, 0])) as Record<TaskStatus, number>;
    for (const task of this.matching(filter.search)) counts[task.status] += 1;
    return counts;
  }

  /** Case-insensitive title search shared by listing and counting, so tab counts always match the list. */
  private matching(search?: string): Task[] {
    const needle = search?.trim().toLowerCase();
    const all = [...this.tasks.values()];
    return needle ? all.filter((task) => task.title.toLowerCase().includes(needle)) : all;
  }

  async countCreatedPerDay(since: Date): Promise<Map<string, number>> {
    const from = since.toISOString();
    const perDay = new Map<string, number>();
    for (const task of this.tasks.values()) {
      if (task.createdAt < from) continue;
      const day = task.createdAt.slice(0, 10); // ISO timestamps are UTC, so the prefix is the UTC day
      perDay.set(day, (perDay.get(day) ?? 0) + 1);
    }
    return perDay;
  }

  async findRecentlyUpdated(limit: number): Promise<Task[]> {
    return [...this.tasks.values()]
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt) || b.id.localeCompare(a.id))
      .slice(0, limit)
      .map((task) => ({ ...task }));
  }
}
