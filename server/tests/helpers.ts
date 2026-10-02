import type { Config } from '../src/config/env.js';

export const DEMO_EMAIL = 'demo@test.dev';
export const DEMO_PASSWORD = 'Password123!';

export function testConfig(overrides: Partial<Config> = {}): Config {
  return {
    env: 'test',
    port: 0,
    logLevel: 'silent',
    corsOrigins: ['http://localhost:5173'],
    rateLimit: { windowMs: 60_000, max: 1_000, authMax: 1_000 },
    jwt: { secret: 'test-secret-that-is-at-least-32-characters-long', expiresIn: '1h' },
    demoUser: { name: 'Demo User', email: DEMO_EMAIL, password: DEMO_PASSWORD },
    ...overrides,
  };
}
