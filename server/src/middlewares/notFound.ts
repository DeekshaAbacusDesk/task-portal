import type { RequestHandler } from 'express';
import { NotFoundError } from '../utils/errors.js';

export const notFound: RequestHandler = (req, _res, next) => {
  next(new NotFoundError('Route', `${req.method} ${req.originalUrl}`));
};
