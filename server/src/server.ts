import 'dotenv/config';
import { createServer } from 'node:http';
import { createApp } from './app.js';
import { loadConfig } from './config/env.js';
import { buildContainer } from './container.js';
import { createSocketServer } from './realtime/socket.js';
import { createLogger } from './utils/logger.js';

const SHUTDOWN_TIMEOUT_MS = 10_000;

async function main() {
  const config = loadConfig();
  const logger = createLogger(config);
  const container = await buildContainer(config);

  const app = createApp({ config, logger, container });
  const httpServer = createServer(app);
  const realtime = createSocketServer(httpServer, {
    corsOrigins: config.corsOrigins,
    authService: container.authService,
    events: container.events,
    logger,
  });

  httpServer.listen(config.port, () => {
    logger.info({ port: config.port, env: config.env }, 'Server listening');
  });

  // Stop accepting work, drain in-flight requests and sockets, then exit.
  let shuttingDown = false;
  const shutdown = async (signal: string) => {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info({ signal }, 'Shutting down');

    const forceExit = setTimeout(() => {
      logger.error('Graceful shutdown timed out, forcing exit');
      process.exit(1);
    }, SHUTDOWN_TIMEOUT_MS);
    forceExit.unref();

    await realtime.close(); // also closes the underlying HTTP server
    logger.info('Shutdown complete');
    process.exit(0);
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('unhandledRejection', (reason) => {
    logger.fatal({ err: reason }, 'Unhandled promise rejection');
    void shutdown('unhandledRejection');
  });
}

main().catch((err) => {
  // Logger may not exist yet (e.g. invalid config), so fall back to stderr.
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
