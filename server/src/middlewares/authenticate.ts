import type { RequestHandler } from 'express';
import type { AuthService } from '../services/auth.service.js';
import { UnauthorizedError } from '../utils/errors.js';

export function authenticate(auth: AuthService): RequestHandler {
  return (req, _res, next) => {
    const header = req.headers.authorization;
    const [scheme, token] = header?.split(' ') ?? [];

    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedError('Missing or malformed Authorization header');
    }

    req.user = auth.verifyToken(token);
    next();
  };
}
