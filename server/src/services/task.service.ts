import { randomUUID } from 'node:crypto';
import type { CreateTaskInput, Task, TaskListResult, TaskQuery, TaskStatus, UpdateTaskInput } from '../domain/task.js';
import type { EventBus } from '../events/eventBus.js';
import type { TaskRepository } from '../repositories/task.repository.js';
import { NotFoundError } from '../utils/errors.js';

export class TaskService {
  constructor(
    private readonly repository: TaskRepository,
    private readonly events: EventBus,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async create(input: CreateTaskInput): Promise<Task> {
    const timestamp = this.now().toISOString();
    const task = await this.repository.create({
      id: randomUUID(),
      title: input.title,
      description: input.description,
      status: input.status,
      dueDate: input.dueDate,
      completedAt: input.status === 'completed' ? timestamp : null,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    this.events.publish('task.created', { task });
    return task;
  }

  async list(query: TaskQuery): Promise<TaskListResult> {
    const [{ items, total }, counts] = await Promise.all([
      this.repository.findMany(query),
      this.repository.countByStatus({ search: query.search }),
    ]);
    return {
      items,
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(total / query.limit),
      statusCounts: { all: counts.pending + counts['in-progress'] + counts.completed, ...counts },
    };
  }

  async getById(id: string): Promise<Task> {
    const task = await this.repository.findById(id);
    if (!task) throw new NotFoundError('Task', id);
    return task;
  }

  async update(id: string, changes: UpdateTaskInput): Promise<Task> {
    const existing = await this.getById(id);

    const timestamp = this.now().toISOString();
    const updated = await this.repository.update(id, {
      ...changes,
      ...completionChange(existing.status, changes.status, timestamp),
      updatedAt: timestamp,
    });
    if (!updated) throw new NotFoundError('Task', id);

    this.events.publish('task.updated', { task: updated });
    if (changes.status && changes.status !== existing.status) {
      this.events.publish('task.status_changed', { task: updated, previousStatus: existing.status });
    }
    return updated;
  }

  async delete(id: string): Promise<void> {
    const deleted = await this.repository.delete(id);
    if (!deleted) throw new NotFoundError('Task', id);
    this.events.publish('task.deleted', { id });
  }
}

/** completedAt is stamped on entering "completed" and cleared on leaving it; otherwise left untouched. */
function completionChange(from: TaskStatus, to: TaskStatus | undefined, timestamp: string): { completedAt?: string | null } {
  if (!to || to === from) return {};
  if (to === 'completed') return { completedAt: timestamp };
  if (from === 'completed') return { completedAt: null };
  return {};
}
