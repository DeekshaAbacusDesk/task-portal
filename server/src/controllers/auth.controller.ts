import type { Request, Response } from 'express';
import type { AuthService } from '../services/auth.service.js';
import { UnauthorizedError } from '../utils/errors.js';
import { loginSchema } from '../validators/auth.schemas.js';

export function createAuthController(auth: AuthService) {
  return {
    async login(req: Request, res: Response) {
      const { email, password } = loginSchema.parse(req.body);
      res.json({ data: await auth.login(email, password) });
    },

    async me(req: Request, res: Response) {
      if (!req.user) throw new UnauthorizedError();
      res.json({ data: await auth.getUser(req.user.id) });
    },
  };
}

export type AuthController = ReturnType<typeof createAuthController>;
