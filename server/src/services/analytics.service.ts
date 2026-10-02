import type { AnalyticsSummary, DailyCount } from '../domain/analytics.js';
import type { TaskRepository } from '../repositories/task.repository.js';

const DAY_MS = 24 * 60 * 60 * 1000;
const RECENT_LIMIT = 5;

export class AnalyticsService {
  constructor(
    private readonly tasks: TaskRepository,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async getSummary({ days }: { days: number }): Promise<AnalyticsSummary> {
    const windowStart = startOfUtcDay(new Date(this.now().getTime() - (days - 1) * DAY_MS));

    const [byStatus, perDay, recentlyUpdated] = await Promise.all([
      this.tasks.countByStatus(),
      this.tasks.countCreatedPerDay(windowStart),
      this.tasks.findRecentlyUpdated(RECENT_LIMIT),
    ]);

    const total = byStatus.pending + byStatus['in-progress'] + byStatus.completed;

    // Zero-fill so the client always receives a continuous series — gaps are data, not missing rows.
    const createdPerDay: DailyCount[] = Array.from({ length: days }, (_, i) => {
      const date = new Date(windowStart.getTime() + i * DAY_MS).toISOString().slice(0, 10);
      return { date, count: perDay.get(date) ?? 0 };
    });

    return {
      total,
      byStatus,
      completionRate: total === 0 ? 0 : byStatus.completed / total,
      createdPerDay,
      recentlyUpdated,
    };
  }
}

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}
