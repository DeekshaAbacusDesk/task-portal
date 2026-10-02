import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { AppError, BadRequestError, ValidationError } from '../utils/errors.js';

/** Maps known error types onto AppError; everything else is an unexpected failure. */
function normalise(err: unknown): AppError | null {
  if (err instanceof AppError) return err;

  if (err instanceof ZodError) {
    return new ValidationError(
      err.issues.map((issue) => ({ field: issue.path.join('.') || null, message: issue.message })),
    );
  }

  // Malformed JSON body from express.json()
  if (err instanceof SyntaxError && 'type' in err && err.type === 'entity.parse.failed') {
    return new BadRequestError('Request body is not valid JSON');
  }

  return null;
}

/** Single place that turns errors into the API's error contract: { error: { code, message, details?, requestId } }. */
export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  const known = normalise(err);
  const requestId = req.id;

  if (!known) {
    req.log.error({ err }, 'Unhandled error');
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred', requestId },
    });
    return;
  }

  res.status(known.statusCode).json({
    error: {
      code: known.code,
      message: known.message,
      ...(known.details !== undefined && { details: known.details }),
      requestId,
    },
  });
};
