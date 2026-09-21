import { logWarn } from '../../common/logger.js';

// Maps job name (from config.json) to its lazy-import function
const jobModuleMap = {
  nblArchiver: () => import('./dataMigration/nblArchiverJob.js'),
};

/**
 * Loads and returns enabled job modules based on the loaded config object.
 * Only imports modules for jobs that are enabled (isEnabled: true).
 *
 * @param {object} config — the loaded configuration object
 * @returns {Promise<Array>} array of job module default exports
 */
export async function getConfiguredModules(config) {
  const jobs = config.jobs || {};
  const enabledJobNames = Object.keys(jobs).filter((j) => jobs[j].isEnabled);
  const modules = [];
  for (const jobName of enabledJobNames) {
    if (jobModuleMap[jobName]) {
      const mod = await jobModuleMap[jobName]();
      modules.push(mod.default);
    } else {
      logWarn(`[getConfiguredModules] Unknown job name "${jobName}" in config — ignored.`);
    }
  }
  return modules;
}
