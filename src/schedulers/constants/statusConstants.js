import { LogLevel } from '../../common/constants/logLevel.js';

export const JobStatus = {
  STARTED: 'STARTED',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  RETRYING: 'RETRYING',
  SCHEDULED: 'SCHEDULED',
  SKIPPED: 'SKIPPED (concurrency limit)',
};

export { LogLevel };
