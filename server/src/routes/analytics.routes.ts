import { Router } from 'express';
import type { AnalyticsController } from '../controllers/analytics.controller.js';

export function createAnalyticsRouter(controller: AnalyticsController): Router {
  const router = Router();

  router.get('/summary', controller.summary);

  return router;
}
