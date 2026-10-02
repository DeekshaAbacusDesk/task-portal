export const env = {
  apiUrl: import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api/v1',
  socketUrl: import.meta.env.VITE_SOCKET_URL ?? 'http://localhost:4000',
} as const;
