import express from 'express';
import dotenv from 'dotenv';
import { loadSchedulerConfig } from './src/schedulers/config.js';
import { scheduleJobs } from './src/schedulers/core/jobScheduler.js';
import { logError, logInfo } from './src/common/logger.js';
import { closePool as closeSqlPool } from './src/dblayer/sqlserver/db.js';
import jobStatusRoutes from './src/schedulers/routes/index.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Main entry point — loads config, schedules jobs, starts HTTP server
async function startApp() {
  try {
    logInfo('Starting application...');
    const config = await loadSchedulerConfig();
    await scheduleJobs(config);

    // Testing Route
    app.get("/", function (req, res) {
      res.send({
        message: "Server is running"
      });
    });

    app.use('/api/jobs', jobStatusRoutes);

    app.use(function (req, res, next) {
      const error = new Error('Not Found');
      error.status = 404;
      next(error);
    });

    app.listen(port, () => {
      logInfo(`Server and WebSocket listening at http://localhost:${port}`);
    });
  } catch (err) {
    logError('Application failed to start: ' + (err && err.message ? err.message : err));
    process.exit(1);
  }
}

export function handleUncaughtException(err) {
  logError('Uncaught Exception: ' + (err && err.message ? err.message : err));
  if (err && err.stack) logError(err.stack);
  Promise.all([closeSqlPool()]).finally(() => {
    process.exit(1);
  });
}

function handleShutdown(signal) {
  logInfo(`Received ${signal || 'shutdown'} signal. Shutting down gracefully...`);
  Promise.all([closeSqlPool()]).finally(() => {
    process.exit(0);
  });
}

if (typeof process.on === 'function' && process.env.NODE_ENV !== 'test') {
  process.on('SIGINT', () => handleShutdown('SIGINT'));
  process.on('SIGTERM', () => handleShutdown('SIGTERM'));
  process.on('uncaughtException', handleUncaughtException);
}

await startApp();
