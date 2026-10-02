import { EventEmitter } from 'node:events';
import type { Task, TaskStatus } from '../domain/task.js';

export interface DomainEvents {
  'task.created': { task: Task };
  'task.updated': { task: Task };
  'task.status_changed': { task: Task; previousStatus: TaskStatus };
  'task.deleted': { id: string };
}

type Handler<K extends keyof DomainEvents> = (payload: DomainEvents[K]) => void;

/**
 * In-process, typed pub/sub. Services publish domain events here without knowing who listens
 * (today: the Socket.IO layer). In production this seam is where Redis pub/sub / SNS would plug in.
 */
export class EventBus {
  private readonly emitter = new EventEmitter();

  publish<K extends keyof DomainEvents>(event: K, payload: DomainEvents[K]): void {
    this.emitter.emit(event, payload);
  }

  subscribe<K extends keyof DomainEvents>(event: K, handler: Handler<K>): () => void {
    this.emitter.on(event, handler);
    return () => this.emitter.off(event, handler);
  }
}
