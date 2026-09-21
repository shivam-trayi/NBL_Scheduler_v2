import schedule from 'node-schedule';
import { log } from '../../common/logger.js';
import { JobStatus } from '../constants/statusConstants.js';
import { LogLevel } from '../../common/constants/logLevel.js';

// In-memory concurrency registry — prevents overlapping runs of the same job
const jobRegistry = {};

function logEvent(event, jobName, info = '', level = LogLevel.INFO) {
  const message = `[${jobName}] ${event}${info ? ': ' + info : ''}`;
  log({ message, messageType: level });
}

/**
 * Runs a job function with a concurrency lock and optional retry.
 * If the job is already running (running >= maxConcurrency), it is skipped.
 */
function runWithLock(jobName, fn, maxConcurrency = 1, retries = 0) {
  if (!jobRegistry[jobName]) jobRegistry[jobName] = { running: 0 };

  if (jobRegistry[jobName].running >= maxConcurrency) {
    logEvent(JobStatus.SKIPPED, jobName, '', LogLevel.WARN);
    return;
  }

  jobRegistry[jobName].running++;
  logEvent(JobStatus.STARTED, jobName, '', LogLevel.INFO);

  Promise.resolve()
    .then(fn)
    .then(() => logEvent(JobStatus.COMPLETED, jobName, '', LogLevel.INFO))
    .catch((err) => {
      logEvent(
        JobStatus.FAILED,
        jobName,
        err && err.message ? err.message : String(err),
        LogLevel.ERROR
      );
      if (retries > 0) {
        logEvent(JobStatus.RETRYING, jobName, `${retries} retries remaining`, LogLevel.WARN);
        setTimeout(() => runWithLock(jobName, fn, maxConcurrency, retries - 1), 1000);
      }
    })
    .finally(() => jobRegistry[jobName].running--);
}

/**
 * Schedule a job using either a cron string (Repetitive) or a specific Date (FixedDateTime).
 * Uses node-schedule's native cron string support — no manual cron parsing.
 *
 * @param {Object} options
 * @param {string} options.jobName
 * @param {string|null} options.cron       — standard 5-field cron expression
 * @param {Date|null}   options.date       — specific date for one-time run
 * @param {Function}    options.fn         — async job logic
 * @param {number}      options.maxConcurrency
 * @param {number}      options.retries
 * @returns {Object} node-schedule job handle
 */
export function scheduleJob({ jobName, cron, fn, date, maxConcurrency = 1, retries = 0 }) {
  let job;
  if (date) {
    job = schedule.scheduleJob(date, () => runWithLock(jobName, fn, maxConcurrency, retries));
    logEvent(JobStatus.SCHEDULED, jobName, `date: ${date.toISOString()}`, LogLevel.INFO);
  } else {
    // Use native cron string — handles */N, ranges, lists correctly
    job = schedule.scheduleJob(cron, () => runWithLock(jobName, fn, maxConcurrency, retries));
    logEvent(JobStatus.SCHEDULED, jobName, `cron: ${cron}`, LogLevel.INFO);
  }
  return job;
}

export function cancelJob(job) {
  if (job) {
    job.cancel();
  }
}
