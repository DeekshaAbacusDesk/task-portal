import { isAxiosError } from 'axios';

/** Normalised error shape for the whole UI, mirroring the API's `{ error: { code, message, details } }`. */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function toApiError(err: unknown): ApiError {
  if (err instanceof ApiError) return err;

  if (isAxiosError(err)) {
    if (!err.response) {
      return new ApiError('Unable to reach the server. Check your connection and try again.', 0, 'NETWORK_ERROR');
    }
    const body = err.response.data?.error;
    return new ApiError(
      body?.message ?? 'Something went wrong. Please try again.',
      err.response.status,
      body?.code ?? 'UNKNOWN_ERROR',
      body?.details,
    );
  }

  return new ApiError('Something went wrong. Please try again.', 0, 'UNKNOWN_ERROR');
}
