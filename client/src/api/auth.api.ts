import type { LoginCredentials, LoginResponse, User } from '../types/auth';
import { httpClient } from './httpClient';

export const authApi = {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const { data } = await httpClient.post<{ data: LoginResponse }>('/auth/login', credentials);
    return data.data;
  },

  async me(): Promise<User> {
    const { data } = await httpClient.get<{ data: User }>('/auth/me');
    return data.data;
  },
};
