import { rateLimit } from 'express-rate-limit';
import { TooManyRequestsError } from '../utils/errors.js';

interface RateLimiterOptions {
  windowMs: number;
  max: number;
  message?: string;
}

/**
 * Per-IP fixed-window limiter. Uses the default in-memory store, which is per-instance;
 * behind a load balancer this must move to a shared store (e.g. rate-limit-redis).
 */
export function createRateLimiter({ windowMs, max, message }: RateLimiterOptions) {
  return rateLimit({
    windowMs,
    limit: max,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (_req, _res, next) => next(new TooManyRequestsError(message)),
  });
}
