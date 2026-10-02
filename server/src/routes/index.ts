import { Router } from 'express';
import type { Config } from '../config/env.js';
import { createAnalyticsController } from '../controllers/analytics.controller.js';
import { createAuthController } from '../controllers/auth.controller.js';
import { createTaskController } from '../controllers/task.controller.js';
import { authenticate } from '../middlewares/authenticate.js';
import { createRateLimiter } from '../middlewares/rateLimiter.js';
import type { AnalyticsService } from '../services/analytics.service.js';
import type { AuthService } from '../services/auth.service.js';
import type { TaskService } from '../services/task.service.js';
import { createAnalyticsRouter } from './analytics.routes.js';
import { createAuthRouter } from './auth.routes.js';
import { createTaskRouter } from './task.routes.js';

interface ApiRouterDeps {
  config: Config;
  taskService: TaskService;
  authService: AuthService;
  analyticsService: AnalyticsService;
}

export function createApiRouter({ config, taskService, authService, analyticsService }: ApiRouterDeps): Router {
  const router = Router();
  const requireAuth = authenticate(authService);

  router.get('/health', (_req, res) => {
    res.json({ data: { status: 'ok', uptime: Math.round(process.uptime()) } });
  });

  router.use(
    '/auth',
    createAuthRouter({
      controller: createAuthController(authService),
      requireAuth,
      // Tighter limit on login to slow down credential stuffing.
      loginLimiter: createRateLimiter({
        windowMs: config.rateLimit.windowMs,
        max: config.rateLimit.authMax,
        message: 'Too many login attempts, please try again later',
      }),
    }),
  );

  router.use('/tasks', requireAuth, createTaskRouter(createTaskController(taskService)));
  router.use('/analytics', requireAuth, createAnalyticsRouter(createAnalyticsController(analyticsService)));

  return router;
}
