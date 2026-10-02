export const PATHS = {
  login: '/login',
  analytics: '/analytics',
  tasks: '/tasks',
} as const;

/** Where an authenticated user lands after login and for any unknown URL. */
export const HOME_PATH = PATHS.analytics;
