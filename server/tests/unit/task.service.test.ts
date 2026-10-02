import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EventBus } from '../../src/events/eventBus.js';
import { InMemoryTaskRepository } from '../../src/repositories/inMemoryTask.repository.js';
import { TaskService } from '../../src/services/task.service.js';
import { NotFoundError } from '../../src/utils/errors.js';

describe('TaskService', () => {
  let events: EventBus;
  let service: TaskService;
  let clock: number;

  beforeEach(() => {
    events = new EventBus();
    clock = Date.parse('2026-01-01T00:00:00.000Z');
    // Deterministic, strictly increasing timestamps so ordering assertions are stable.
    service = new TaskService(new InMemoryTaskRepository(), events, () => new Date((clock += 1000)));
  });

  async function seed(titles: string[], status: 'pending' | 'in-progress' | 'completed' = 'pending') {
    for (const title of titles) await service.create({ title, description: '', status, dueDate: null });
  }

  describe('create', () => {
    it('assigns id and timestamps, and publishes task.created', async () => {
      const onCreated = vi.fn();
      events.subscribe('task.created', onCreated);

      const task = await service.create({ title: 'Write README', description: 'Docs', status: 'pending', dueDate: null });

      expect(task.id).toMatch(/^[0-9a-f-]{36}$/);
      expect(task.createdAt).toBe(task.updatedAt);
      expect(onCreated).toHaveBeenCalledWith({ task });
    });
  });

  describe('list', () => {
    it('paginates newest first and reports totals', async () => {
      await seed(['t1', 't2', 't3', 't4', 't5']);

      const page1 = await service.list({ page: 1, limit: 2 });
      const page3 = await service.list({ page: 3, limit: 2 });

      expect(page1.items.map((t) => t.title)).toEqual(['t5', 't4']);
      expect(page3.items.map((t) => t.title)).toEqual(['t1']);
      expect(page1).toMatchObject({ total: 5, totalPages: 3, page: 1, limit: 2 });
    });

    it('combines status filter with case-insensitive title search', async () => {
      await seed(['Fix login bug', 'Fix header'], 'pending');
      await seed(['Fix footer'], 'completed');

      const result = await service.list({ page: 1, limit: 10, status: 'pending', search: 'FIX' });

      expect(result.items.map((t) => t.title)).toEqual(['Fix header', 'Fix login bug']);
      expect(result.total).toBe(2);
    });

    it('returns per-status counts for the current search, independent of the status filter', async () => {
      await seed(['Fix login bug', 'Fix header'], 'pending');
      await seed(['Fix footer'], 'completed');
      await seed(['Write docs'], 'in-progress');

      const result = await service.list({ page: 1, limit: 10, status: 'completed', search: 'fix' });

      expect(result.statusCounts).toEqual({ all: 3, pending: 2, 'in-progress': 0, completed: 1 });
    });
  });

  describe('completion date', () => {
    it('is stamped when created as completed, and null otherwise', async () => {
      const done = await service.create({ title: 'a', description: '', status: 'completed', dueDate: null });
      const open = await service.create({ title: 'b', description: '', status: 'pending', dueDate: '2026-10-10' });

      expect(done.completedAt).toBe(done.createdAt);
      expect(open).toMatchObject({ completedAt: null, dueDate: '2026-10-10' });
    });

    it('is set on entering completed, kept on unrelated edits, and cleared when reopened', async () => {
      const task = await service.create({ title: 'Ship', description: '', status: 'in-progress', dueDate: null });

      const completed = await service.update(task.id, { status: 'completed' });
      expect(completed.completedAt).toBe(completed.updatedAt);

      const retitled = await service.update(task.id, { title: 'Ship it' });
      expect(retitled.completedAt).toBe(completed.completedAt);

      const reopened = await service.update(task.id, { status: 'pending' });
      expect(reopened.completedAt).toBeNull();
    });
  });

  describe('update', () => {
    it('publishes task.status_changed with the previous status when status changes', async () => {
      const task = await service.create({ title: 'Ship', description: '', status: 'pending', dueDate: null });
      const onStatusChanged = vi.fn();
      events.subscribe('task.status_changed', onStatusChanged);

      const updated = await service.update(task.id, { status: 'in-progress' });

      expect(updated.status).toBe('in-progress');
      expect(updated.updatedAt > task.updatedAt).toBe(true);
      expect(onStatusChanged).toHaveBeenCalledWith({ task: updated, previousStatus: 'pending' });
    });

    it('does not publish task.status_changed when status is unchanged', async () => {
      const task = await service.create({ title: 'Ship', description: '', status: 'pending', dueDate: null });
      const onUpdated = vi.fn();
      const onStatusChanged = vi.fn();
      events.subscribe('task.updated', onUpdated);
      events.subscribe('task.status_changed', onStatusChanged);

      await service.update(task.id, { title: 'Ship it', status: 'pending', dueDate: null });

      expect(onUpdated).toHaveBeenCalledOnce();
      expect(onStatusChanged).not.toHaveBeenCalled();
    });

    it('throws NotFoundError for an unknown id', async () => {
      await expect(service.update('missing', { title: 'x' })).rejects.toBeInstanceOf(NotFoundError);
    });
  });

  describe('delete', () => {
    it('removes the task and publishes task.deleted', async () => {
      const task = await service.create({ title: 'Temp', description: '', status: 'pending', dueDate: null });
      const onDeleted = vi.fn();
      events.subscribe('task.deleted', onDeleted);

      await service.delete(task.id);

      expect(onDeleted).toHaveBeenCalledWith({ id: task.id });
      await expect(service.getById(task.id)).rejects.toBeInstanceOf(NotFoundError);
    });

    it('throws NotFoundError for an unknown id', async () => {
      await expect(service.delete('missing')).rejects.toBeInstanceOf(NotFoundError);
    });
  });
});
