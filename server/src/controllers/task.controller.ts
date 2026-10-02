import type { Request, Response } from 'express';
import type { TaskService } from '../services/task.service.js';
import {
  createTaskSchema,
  listTasksQuerySchema,
  taskIdParamsSchema,
  updateTaskSchema,
} from '../validators/task.schemas.js';

/**
 * HTTP adapter only: parse input, call the service, shape the response.
 * Validation failures throw ZodError, which the central error handler maps to 422.
 * Express 5 forwards rejected promises to the error handler, so no try/catch is needed here.
 */
export function createTaskController(tasks: TaskService) {
  return {
    async list(req: Request, res: Response) {
      const query = listTasksQuerySchema.parse(req.query);
      const { items, ...meta } = await tasks.list(query);
      res.json({ data: items, meta });
    },

    async getById(req: Request, res: Response) {
      const { id } = taskIdParamsSchema.parse(req.params);
      res.json({ data: await tasks.getById(id) });
    },

    async create(req: Request, res: Response) {
      const input = createTaskSchema.parse(req.body);
      const task = await tasks.create(input);
      res.status(201).location(`${req.baseUrl}/${task.id}`).json({ data: task });
    },

    async update(req: Request, res: Response) {
      const { id } = taskIdParamsSchema.parse(req.params);
      const changes = updateTaskSchema.parse(req.body);
      res.json({ data: await tasks.update(id, changes) });
    },

    async remove(req: Request, res: Response) {
      const { id } = taskIdParamsSchema.parse(req.params);
      await tasks.delete(id);
      res.status(204).end();
    },
  };
}

export type TaskController = ReturnType<typeof createTaskController>;
