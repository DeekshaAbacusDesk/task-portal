import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { authApi } from '../api/auth.api';
import { setUnauthorizedHandler } from '../api/httpClient';
import { tokenStorage } from '../lib/tokenStorage';
import type { LoginResponse, User } from '../types/auth';

type AuthStatus = 'checking' | 'authenticated' | 'anonymous';

export interface AuthContextValue {
  status: AuthStatus;
  user: User | null;
  token: string | null;
  startSession: (session: LoginResponse) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => tokenStorage.get());
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>(() => (tokenStorage.get() ? 'checking' : 'anonymous'));

  const logout = useCallback(() => {
    tokenStorage.clear();
    setToken(null);
    setUser(null);
    setStatus('anonymous');
  }, []);

  const startSession = useCallback(({ token, user }: LoginResponse) => {
    tokenStorage.set(token);
    setToken(token);
    setUser(user);
    setStatus('authenticated');
  }, []);

  // Any 401 from the API ends the session.
  useEffect(() => {
    setUnauthorizedHandler(logout);
    return () => setUnauthorizedHandler(null);
  }, [logout]);

  // Restore a persisted session by validating the stored token.
  useEffect(() => {
    if (status !== 'checking') return;
    let cancelled = false;
    authApi
      .me()
      .then((me) => {
        if (cancelled) return;
        setUser(me);
        setStatus('authenticated');
      })
      .catch(() => {
        if (!cancelled) logout();
      });
    return () => {
      cancelled = true;
    };
  }, [status, logout]);

  const value = useMemo(
    () => ({ status, user, token, startSession, logout }),
    [status, user, token, startSession, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
