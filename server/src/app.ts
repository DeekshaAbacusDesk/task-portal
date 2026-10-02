import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';
import type { Logger } from 'pino';
import type { Config } from './config/env.js';
import type { Container } from './container.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { notFound } from './middlewares/notFound.js';
import { createRateLimiter } from './middlewares/rateLimiter.js';
import { requestLogger } from './middlewares/requestLogger.js';
import { createApiRouter } from './routes/index.js';

interface AppDeps {
  config: Config;
  logger: Logger;
  container: Container;
}

/** Builds the Express app without binding a port, so tests can drive it in-process. */
export function createApp({ config, logger, container }: AppDeps): Express {
  const app = express();

  app.disable('x-powered-by');
  // Correct client IPs for rate limiting when running behind one proxy/load balancer.
  app.set('trust proxy', 1);

  app.use(requestLogger(logger));
  app.use(helmet());
  app.use(cors({ origin: config.corsOrigins, exposedHeaders: ['X-Request-Id'] }));
  app.use(express.json({ limit: '100kb' }));

  app.use(
    '/api',
    createRateLimiter({ windowMs: config.rateLimit.windowMs, max: config.rateLimit.max }),
  );
  app.use(
    '/api/v1',
    createApiRouter({
      config,
      taskService: container.taskService,
      authService: container.authService,
      analyticsService: container.analyticsService,
    }),
  );

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
