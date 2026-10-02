import { io, type Socket } from 'socket.io-client';
import { env } from '../config/env';

/** Event names on the wire — mirrors server/src/realtime/socket.ts. */
export const SOCKET_EVENTS = {
  taskCreated: 'task:created',
  taskUpdated: 'task:updated',
  taskStatusChanged: 'task:status_changed',
  taskDeleted: 'task:deleted',
} as const;

export function createSocket(token: string): Socket {
  return io(env.socketUrl, {
    auth: { token },
    // WebSocket-only skips the long-polling handshake, which also removes the need for sticky sessions.
    transports: ['websocket'],
  });
}
