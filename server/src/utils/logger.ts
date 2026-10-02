import { pino, type Logger } from 'pino';
import type { Config } from '../config/env.js';

export function createLogger(config: Pick<Config, 'env' | 'logLevel'>): Logger {
  return pino({
    level: config.env === 'test' ? 'silent' : config.logLevel,
    redact: { paths: ['req.headers.authorization', 'req.headers.cookie', '*.password'], censor: '[redacted]' },
    // Human-readable logs locally; raw JSON elsewhere so log shippers (e.g. CloudWatch) can parse them.
    transport: config.env === 'development' ? { target: 'pino-pretty', options: { singleLine: true } } : undefined,
  });
}
