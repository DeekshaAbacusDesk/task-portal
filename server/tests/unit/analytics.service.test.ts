import { describe, expect, it } from 'vitest';
import type { Task } from '../../src/domain/task.js';
import { InMemoryTaskRepository } from '../../src/repositories/inMemoryTask.repository.js';
import { AnalyticsService } from '../../src/services/analytics.service.js';

const NOW = new Date('2026-10-02T15:00:00.000Z');

function task(id: string, status: Task['status'], createdAt: string, updatedAt = createdAt): Task {
  return { id, title: id, description: '', status, dueDate: null, completedAt: null, createdAt, updatedAt };
}

async function serviceWith(tasks: Task[]) {
  const repo = new InMemoryTaskRepository();
  for (const t of tasks) await repo.create(t);
  return new AnalyticsService(repo, () => NOW);
}

describe('AnalyticsService', () => {
  it('returns zeroed metrics and a continuous zero-filled series when there are no tasks', async () => {
    const summary = await (await serviceWith([])).getSummary({ days: 3 });

    expect(summary).toMatchObject({ total: 0, completionRate: 0, recentlyUpdated: [] });
    expect(summary.byStatus).toEqual({ pending: 0, 'in-progress': 0, completed: 0 });
    expect(summary.createdPerDay).toEqual([
      { date: '2026-09-30', count: 0 },
      { date: '2026-10-01', count: 0 },
      { date: '2026-10-02', count: 0 },
    ]);
  });

  it('counts by status, computes completion rate and buckets creations by UTC day within the window', async () => {
    const service = await serviceWith([
      task('a', 'completed', '2026-10-02T09:00:00.000Z'),
      task('b', 'completed', '2026-10-02T23:59:59.000Z'),
      task('c', 'pending', '2026-10-01T00:00:00.000Z'),
      task('d', 'in-progress', '2026-09-29T23:59:59.999Z'), // just outside a 3-day window
    ]);

    const summary = await service.getSummary({ days: 3 });

    expect(summary.total).toBe(4);
    expect(summary.byStatus).toEqual({ pending: 1, 'in-progress': 1, completed: 2 });
    expect(summary.completionRate).toBe(0.5);
    expect(summary.createdPerDay).toEqual([
      { date: '2026-09-30', count: 0 },
      { date: '2026-10-01', count: 1 },
      { date: '2026-10-02', count: 2 },
    ]);
  });

  it('lists the most recently updated tasks first, capped at five', async () => {
    const tasks = Array.from({ length: 7 }, (_, i) =>
      task(`t${i}`, 'pending', '2026-10-01T00:00:00.000Z', `2026-10-02T0${i}:00:00.000Z`),
    );
    const summary = await (await serviceWith(tasks)).getSummary({ days: 14 });

    expect(summary.recentlyUpdated.map((t) => t.id)).toEqual(['t6', 't5', 't4', 't3', 't2']);
  });
});
