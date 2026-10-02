import type { Express } from 'express';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.js';
import { buildContainer } from '../../src/container.js';
import { createLogger } from '../../src/utils/logger.js';
import { DEMO_EMAIL, DEMO_PASSWORD, testConfig } from '../helpers.js';

describe('Tasks API', () => {
  let app: Express;
  let token: string;

  beforeAll(async () => {
    const config = testConfig();
    app = createApp({ config, logger: createLogger(config), container: await buildContainer(config) });

    const login = await request(app).post('/api/v1/auth/login').send({ email: DEMO_EMAIL, password: DEMO_PASSWORD });
    expect(login.status).toBe(200);
    token = login.body.data.token;
  });

  const authed = () => ({ Authorization: `Bearer ${token}` });

  it('rejects requests without a token', async () => {
    const res = await request(app).get('/api/v1/tasks');

    expect(res.status).toBe(401);
    expect(res.body.error).toMatchObject({ code: 'UNAUTHORIZED' });
    expect(res.body.error.requestId).toBeTruthy();
  });

  it('rejects bad credentials with 401', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({ email: DEMO_EMAIL, password: 'wrong' });
    expect(res.status).toBe(401);
  });

  it('supports the full task lifecycle', async () => {
    // Create
    const created = await request(app)
      .post('/api/v1/tasks')
      .set(authed())
      .send({ title: 'Prepare demo', description: 'Slides and script' });
    expect(created.status).toBe(201);
    expect(created.body.data).toMatchObject({ title: 'Prepare demo', status: 'pending' });
    const id: string = created.body.data.id;

    await request(app).post('/api/v1/tasks').set(authed()).send({ title: 'Other task', status: 'completed' });

    // List with filter + search
    const listed = await request(app)
      .get('/api/v1/tasks')
      .query({ status: 'pending', search: 'demo', page: 1, limit: 5 })
      .set(authed());
    expect(listed.status).toBe(200);
    expect(listed.body.data).toHaveLength(1);
    expect(listed.body.meta).toEqual({
      total: 1,
      page: 1,
      limit: 5,
      totalPages: 1,
      // Counts follow the search ("demo") but not the status filter, so every tab shows its own total.
      statusCounts: { all: 1, pending: 1, 'in-progress': 0, completed: 0 },
    });

    // Update status
    const updated = await request(app).patch(`/api/v1/tasks/${id}`).set(authed()).send({ status: 'completed' });
    expect(updated.status).toBe(200);
    expect(updated.body.data.status).toBe('completed');

    // Delete, then it's gone
    expect((await request(app).delete(`/api/v1/tasks/${id}`).set(authed())).status).toBe(204);
    expect((await request(app).get(`/api/v1/tasks/${id}`).set(authed())).status).toBe(404);
  });

  it('returns 422 with field details for invalid input', async () => {
    const res = await request(app).post('/api/v1/tasks').set(authed()).send({ title: '', status: 'done', id: 'x' });

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details).toEqual(
      expect.arrayContaining([expect.objectContaining({ field: 'title' }), expect.objectContaining({ field: 'status' })]),
    );
  });

  it('accepts, validates and clears a due date', async () => {
    const bad = await request(app).post('/api/v1/tasks').set(authed()).send({ title: 'Due', dueDate: '2026-13-40' });
    expect(bad.status).toBe(422);
    expect(bad.body.error.details[0].field).toBe('dueDate');

    const created = await request(app).post('/api/v1/tasks').set(authed()).send({ title: 'Due', dueDate: '2026-10-15' });
    expect(created.body.data).toMatchObject({ dueDate: '2026-10-15', completedAt: null });

    const cleared = await request(app).patch(`/api/v1/tasks/${created.body.data.id}`).set(authed()).send({ dueDate: null });
    expect(cleared.body.data.dueDate).toBeNull();
  });

  it('rejects client-supplied completedAt (server-owned)', async () => {
    const res = await request(app).post('/api/v1/tasks').set(authed()).send({ title: 'x', completedAt: '2026-01-01' });
    expect(res.status).toBe(422);
  });

  it('rejects an empty PATCH body', async () => {
    const created = await request(app).post('/api/v1/tasks').set(authed()).send({ title: 'Patch me' });
    const res = await request(app).patch(`/api/v1/tasks/${created.body.data.id}`).set(authed()).send({});

    expect(res.status).toBe(422);
  });

  it('returns 400 for malformed JSON', async () => {
    const res = await request(app)
      .post('/api/v1/tasks')
      .set(authed())
      .set('Content-Type', 'application/json')
      .send('{"title":');

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('BAD_REQUEST');
  });

  it('returns 404 in the standard error shape for unknown routes', async () => {
    const res = await request(app).get('/api/v1/nope');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('serves an authenticated analytics summary and validates the window', async () => {
    expect((await request(app).get('/api/v1/analytics/summary')).status).toBe(401);

    const res = await request(app).get('/api/v1/analytics/summary').query({ days: 7 }).set(authed());
    expect(res.status).toBe(200);
    expect(res.body.data.createdPerDay).toHaveLength(7);
    expect(res.body.data.total).toBe(
      res.body.data.byStatus.pending + res.body.data.byStatus['in-progress'] + res.body.data.byStatus.completed,
    );

    expect((await request(app).get('/api/v1/analytics/summary').query({ days: 500 }).set(authed())).status).toBe(422);
  });
});
