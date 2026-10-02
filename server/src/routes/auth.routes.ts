import { Router, type RequestHandler } from 'express';
import type { AuthController } from '../controllers/auth.controller.js';

interface AuthRouterDeps {
  controller: AuthController;
  requireAuth: RequestHandler;
  loginLimiter: RequestHandler;
}

export function createAuthRouter({ controller, requireAuth, loginLimiter }: AuthRouterDeps): Router {
  const router = Router();

  router.post('/login', loginLimiter, controller.login);
  router.get('/me', requireAuth, controller.me);

  return router;
}
