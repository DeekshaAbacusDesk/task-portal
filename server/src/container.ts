import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import type { Config } from './config/env.js';
import { EventBus } from './events/eventBus.js';
import { InMemoryTaskRepository } from './repositories/inMemoryTask.repository.js';
import { InMemoryUserRepository } from './repositories/inMemoryUser.repository.js';
import { AnalyticsService } from './services/analytics.service.js';
import { AuthService } from './services/auth.service.js';
import { TaskService } from './services/task.service.js';

/**
 * Composition root: the only place that knows concrete implementations.
 * Swapping storage (e.g. Postgres) or the event transport (e.g. Redis) is a change here only.
 */
export async function buildContainer(config: Config) {
  const events = new EventBus();

  const userRepository = new InMemoryUserRepository([
    {
      id: randomUUID(),
      name: config.demoUser.name,
      email: config.demoUser.email,
      passwordHash: await bcrypt.hash(config.demoUser.password, 10),
    },
  ]);

  const taskRepository = new InMemoryTaskRepository();

  return {
    events,
    authService: new AuthService(userRepository, config.jwt),
    taskService: new TaskService(taskRepository, events),
    analyticsService: new AnalyticsService(taskRepository),
  };
}

export type Container = Awaited<ReturnType<typeof buildContainer>>;
