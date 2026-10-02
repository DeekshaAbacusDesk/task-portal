import { useMutation } from '@tanstack/react-query';
import { authApi } from '../api/auth.api';
import type { ApiError } from '../api/apiError';
import type { LoginCredentials, LoginResponse } from '../types/auth';
import { useAuth } from './useAuth';

export function useLogin() {
  const { startSession } = useAuth();

  return useMutation<LoginResponse, ApiError, LoginCredentials>({
    mutationFn: authApi.login,
    onSuccess: startSession,
  });
}
