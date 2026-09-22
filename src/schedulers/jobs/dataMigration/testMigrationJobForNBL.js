import { createConfiguredJob } from '#schedulers/core/jobFactory.js';
import { logInfo } from '#common/logger.js';

/**
 * Test Migration Job for NBL
 *
 * Purpose: Verify that the scheduler engine is working correctly
 * (config loading, job factory, validator, cron scheduling).
 * Does NOT touch the database.
 *
 * Run: cron "* * * * *" = every minute
 * Use: Enable this job first to confirm scheduling works, then enable nblArchiver.
 */
export default {
  getConfiguredJob: createConfiguredJob('testMigrationJobForNBL', async () => {
    logInfo('Test Migration Job For NBL executed at ' + new Date().toISOString());
    // Scheduling engine is working. No DB operations here.
  })
};
