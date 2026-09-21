import { logError } from '../../common/logger.js';

/**
 * Factory that wraps a job's logic function into the standard { getConfiguredJob } shape.
 *
 * @param {string}   jobName   — must match the key in config.json jobs
 * @param {Function} jobLogic  — async function (config) => result
 * @returns {{ getConfiguredJob: Function }}
 */
export function createConfiguredJob(jobName, jobLogic) {
  return async function getConfiguredJob(config) {
    const jobConfig = config.jobs?.[jobName];
    if (!jobConfig) {
      const errorMsg = `Missing configuration for job '${jobName}'. Please add it to config.json.`;
      logError(errorMsg);
      throw new Error(errorMsg);
    }
    if (!jobLogic) {
      const errorMsg = `Unable to run job '${jobName}': supplied job function is null or undefined.`;
      logError(errorMsg);
      throw new Error(errorMsg);
    }
    return {
      jobName,
      fn: async () => jobLogic(config),
      isEnabled: jobConfig.isEnabled,
      maxConcurrency: jobConfig.maxConcurrency,
      retries: jobConfig.retries,
      cronType: jobConfig.cronType,
      date: jobConfig.date,
      cron: jobConfig.cron,
    };
  };
}
