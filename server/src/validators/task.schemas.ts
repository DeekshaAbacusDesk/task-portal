import { z } from 'zod';
import { TASK_STATUSES } from '../domain/task.js';

const title = z.string().trim().min(1, 'Title is required').max(120, 'Title must be at most 120 characters');
const description = z.string().trim().max(1000, 'Description must be at most 1000 characters');
// Date-only (YYYY-MM-DD). Nullable so an update can clear a due date.
const dueDate = z.iso.date({ message: 'Due date must be a valid date (YYYY-MM-DD)' }).nullable();
const status = z.enum(TASK_STATUSES, { message: `Status must be one of: ${TASK_STATUSES.join(', ')}` });

export const taskIdParamsSchema = z.object({
  id: z.string().min(1),
});

export const listTasksQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  status: status.optional(),
  search: z
    .string()
    .trim()
    .max(100)
    .optional()
    .transform((value) => value || undefined),
});

// strictObject rejects unknown keys, so clients can't set server-owned fields like id or createdAt.
export const createTaskSchema = z.strictObject({
  title,
  description: description.default(''),
  status: status.default('pending'),
  dueDate: dueDate.default(null),
});

export const updateTaskSchema = z
  .strictObject({
    title: title.optional(),
    description: description.optional(),
    status: status.optional(),
    dueDate: dueDate.optional(),
  })
  .refine((body) => Object.values(body).some((value) => value !== undefined), {
    message: 'Provide at least one of: title, description, status, dueDate',
  });
