import type { AuthPrincipal } from '../domain/user.js';

declare global {
  namespace Express {
    interface Request {
      /** Set by the `authenticate` middleware. */
      user?: AuthPrincipal;
    }
  }
}

export {};
