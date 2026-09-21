import { getConfiguredModules } from '../jobs/configuredModules.js';
import { scheduleJob } from './scheduler.js';
import { validateJob } from '../validators/jobValidator.js';
import { log } from '../../common/logger.js';
import { JOB_TYPE_REPETITIVE, JOB_TYPE_FIXED_DATE_TIME } from '../constants/jobTypes.js';

/**
 * Main orchestrator:
 * 1. Loads enabled job modules from config
 * 2. Calls getConfiguredJob on each module
 * 3. Validates the job
 * 4. Schedules it
 *
 * @param {object} config — loaded from config.json
 * @returns {Array} array of scheduled node-schedule job handles
 */
export async function scheduleJobs(config) {
  const jobs = [];
  const taskModules = await getConfiguredModules(config);

  for (const task of taskModules) {
    const configuredJob = await task.getConfiguredJob(config);
    const validationResult = validateJob(configuredJob);

    if (!validationResult.isSuccess) {
      log(validationResult);
      continue;
    }

    if (configuredJob.cronType === JOB_TYPE_FIXED_DATE_TIME) {
      jobs.push(
        scheduleJob({
          jobName: configuredJob.jobName,
          cron: null,
          fn: configuredJob.fn,
          date: new Date(configuredJob.date),
          maxConcurrency: configuredJob.maxConcurrency,
          retries: configuredJob.retries,
        })
      );
    } else if (configuredJob.cronType === JOB_TYPE_REPETITIVE && configuredJob.cron) {
      jobs.push(
        scheduleJob({
          jobName: configuredJob.jobName,
          cron: configuredJob.cron,
          fn: configuredJob.fn,
          maxConcurrency: configuredJob.maxConcurrency,
          retries: configuredJob.retries,
        })
      );
    } else {
      log({
        messageType: 'warn',
        message: `Job "${configuredJob.jobName}" has unsupported cronType "${configuredJob.cronType}" or missing cron.`,
      });
    }
  }

  return jobs;
}
