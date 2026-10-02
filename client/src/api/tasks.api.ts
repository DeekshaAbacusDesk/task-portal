import type { Task, TaskChanges, TaskInput, TaskListParams, TaskPage } from '../types/task';
import { httpClient } from './httpClient';

export const tasksApi = {
  async list(params: TaskListParams): Promise<TaskPage> {
    const { data } = await httpClient.get<TaskPage>('/tasks', { params });
    return data;
  },

  async create(input: TaskInput): Promise<Task> {
    const { data } = await httpClient.post<{ data: Task }>('/tasks', input);
    return data.data;
  },

  async update(id: string, changes: TaskChanges): Promise<Task> {
    const { data } = await httpClient.patch<{ data: Task }>(`/tasks/${id}`, changes);
    return data.data;
  },

  async remove(id: string): Promise<void> {
    await httpClient.delete(`/tasks/${id}`);
  },
};
