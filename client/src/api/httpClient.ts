import axios from 'axios';
import { env } from '../config/env';
import { tokenStorage } from '../lib/tokenStorage';
import { toApiError } from './apiError';

export const httpClient = axios.create({
  baseURL: env.apiUrl,
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
});

let onUnauthorized: (() => void) | null = null;

/** Lets the auth layer react to expired/invalid tokens without the HTTP layer depending on React. */
export function setUnauthorizedHandler(handler: (() => void) | null): void {
  onUnauthorized = handler;
}

httpClient.interceptors.request.use((config) => {
  const token = tokenStorage.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

httpClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const apiError = toApiError(error);
    const isLoginRequest = error.config?.url?.includes('/auth/login');
    if (apiError.status === 401 && !isLoginRequest) onUnauthorized?.();
    return Promise.reject(apiError);
  },
);
