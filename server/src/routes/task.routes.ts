import { Router } from 'express';
import type { TaskController } from '../controllers/task.controller.js';

export function createTaskRouter(controller: TaskController): Router {
  const router = Router();

  router.get('/', controller.list);
  router.post('/', controller.create);
  router.get('/:id', controller.getById);
  router.patch('/:id', controller.update);
  router.delete('/:id', controller.remove);

  return router;
}
