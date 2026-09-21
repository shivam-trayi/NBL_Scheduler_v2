import { JOB_TYPE_FIXED_DATE_TIME, JOB_TYPE_REPETITIVE } from '../constants/jobTypes.js';

/**
 * Validates a configured job object before scheduling.
 * Returns { isSuccess, message, messageType }.
 */
export function validateJob(configuredJob) {
  if (!configuredJob.isEnabled) {
    return {
      isSuccess: false,
      message: `Job '${configuredJob.jobName}' is disabled and will not be scheduled.`,
      messageType: 'info',
    };
  }

  if (configuredJob.cronType === JOB_TYPE_FIXED_DATE_TIME) {
    if (!configuredJob.date) {
      return {
        isSuccess: false,
        message: `Job '${configuredJob.jobName}' has no date set and will not be scheduled. (Misconfiguration)`,
        messageType: 'warn',
      };
    }
    const jobDate = new Date(configuredJob.date);
    if (isNaN(jobDate.getTime())) {
      return {
        isSuccess: false,
        message: `Job '${configuredJob.jobName}' has an invalid date and will not be scheduled. (Misconfiguration)`,
        messageType: 'warn',
      };
    }
    if (jobDate < new Date()) {
      return {
        isSuccess: false,
        message: `Job '${configuredJob.jobName}' has a past date (${jobDate.toISOString()}) and will not be scheduled. (Misconfiguration)`,
        messageType: 'warn',
      };
    }
  }

  if (configuredJob.cronType === JOB_TYPE_REPETITIVE) {
    if (
      !configuredJob.cron ||
      typeof configuredJob.cron !== 'string' ||
      configuredJob.cron.trim() === ''
    ) {
      return {
        isSuccess: false,
        message: `Job '${configuredJob.jobName}' has no cron expression and will not be scheduled. (Misconfiguration)`,
        messageType: 'warn',
      };
    }
  }

  return { isSuccess: true, message: null, messageType: null };
}
