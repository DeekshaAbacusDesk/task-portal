import type { Server as HttpServer } from 'node:http';
import type { Logger } from 'pino';
import { Server } from 'socket.io';
import type { EventBus } from '../events/eventBus.js';
import type { AuthService } from '../services/auth.service.js';

/** Event names on the wire. The client mirrors these. */
export const SOCKET_EVENTS = {
  taskCreated: 'task:created',
  taskUpdated: 'task:updated',
  taskStatusChanged: 'task:status_changed',
  taskDeleted: 'task:deleted',
} as const;

interface SocketDeps {
  corsOrigins: string[];
  authService: AuthService;
  events: EventBus;
  logger: Logger;
}

/**
 * Bridges domain events to connected clients. The service layer never touches Socket.IO;
 * this module subscribes to the event bus and fans out. Scaling out = add the Redis adapter here.
 */
export function createSocketServer(httpServer: HttpServer, { corsOrigins, authService, events, logger }: SocketDeps) {
  const io = new Server(httpServer, { cors: { origin: corsOrigins } });

  // Reject unauthenticated connections at the handshake.
  io.use((socket, next) => {
    const token: unknown = socket.handshake.auth?.token;
    if (typeof token !== 'string') return next(new Error('UNAUTHORIZED'));
    try {
      socket.data.user = authService.verifyToken(token);
      next();
    } catch {
      next(new Error('UNAUTHORIZED'));
    }
  });

  io.on('connection', (socket) => {
    logger.debug({ socketId: socket.id, userId: socket.data.user?.id }, 'Socket connected');
    socket.on('disconnect', (reason) => {
      logger.debug({ socketId: socket.id, reason }, 'Socket disconnected');
    });
  });

  const unsubscribers = [
    events.subscribe('task.created', ({ task }) => io.emit(SOCKET_EVENTS.taskCreated, task)),
    events.subscribe('task.updated', ({ task }) => io.emit(SOCKET_EVENTS.taskUpdated, task)),
    events.subscribe('task.status_changed', (payload) => io.emit(SOCKET_EVENTS.taskStatusChanged, payload)),
    events.subscribe('task.deleted', (payload) => io.emit(SOCKET_EVENTS.taskDeleted, payload)),
  ];

  return {
    io,
    close: () =>
      new Promise<void>((resolve) => {
        unsubscribers.forEach((unsubscribe) => unsubscribe());
        io.close(() => resolve());
      }),
  };
}
