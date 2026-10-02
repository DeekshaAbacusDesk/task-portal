import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),

  CORS_ORIGIN: z
    .string()
    .default('http://localhost:5173')
    .transform((value) => value.split(',').map((origin) => origin.trim()).filter(Boolean)),

  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),
  AUTH_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(10),

  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('1h'),

  DEMO_USER_NAME: z.string().min(1).default('Demo User'),
  DEMO_USER_EMAIL: z.email(),
  DEMO_USER_PASSWORD: z.string().min(8),
});

export type Config = {
  env: z.infer<typeof envSchema>['NODE_ENV'];
  port: number;
  logLevel: z.infer<typeof envSchema>['LOG_LEVEL'];
  corsOrigins: string[];
  rateLimit: { windowMs: number; max: number; authMax: number };
  jwt: { secret: string; expiresIn: string };
  demoUser: { name: string; email: string; password: string };
};

/** Parses and validates environment variables. Fails fast so a misconfigured deploy never boots. */
export function loadConfig(source: NodeJS.ProcessEnv = process.env): Config {
  const result = envSchema.safeParse(source);

  if (!result.success) {
    const issues = result.error.issues.map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`).join('\n');
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }

  const e = result.data;
  return {
    env: e.NODE_ENV,
    port: e.PORT,
    logLevel: e.LOG_LEVEL,
    corsOrigins: e.CORS_ORIGIN,
    rateLimit: { windowMs: e.RATE_LIMIT_WINDOW_MS, max: e.RATE_LIMIT_MAX, authMax: e.AUTH_RATE_LIMIT_MAX },
    jwt: { secret: e.JWT_SECRET, expiresIn: e.JWT_EXPIRES_IN },
    demoUser: { name: e.DEMO_USER_NAME, email: e.DEMO_USER_EMAIL, password: e.DEMO_USER_PASSWORD },
  };
}
