import type { Request, Response } from 'express';
import type { AnalyticsService } from '../services/analytics.service.js';
import { analyticsQuerySchema } from '../validators/analytics.schemas.js';

export function createAnalyticsController(analytics: AnalyticsService) {
  return {
    async summary(req: Request, res: Response) {
      const query = analyticsQuerySchema.parse(req.query);
      res.json({ data: await analytics.getSummary(query) });
    },
  };
}

export type AnalyticsController = ReturnType<typeof createAnalyticsController>;
