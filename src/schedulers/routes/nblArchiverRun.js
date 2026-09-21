import express from 'express';
import { loadSchedulerConfig } from '../config.js';
import nblArchiverModule from '../jobs/dataMigration/nblArchiverJob.js';

const router = express.Router();

/**
 * GET /api/jobs/nbl-archiver/run
 * Manual trigger for the NBL archiver job.
 * Optional query param: ?daysOld=N  (overrides config default)
 */
router.get('/nbl-archiver/run', async (req, res) => {
  try {
    const { daysOld } = req.query;

    const config = await loadSchedulerConfig();
    // Deep clone to avoid mutating the shared config object
    const injectedConfig = JSON.parse(JSON.stringify(config));

    if (daysOld !== undefined) {
      injectedConfig.BulkCopy.daysOld = Number(daysOld);
    }

    const executionData = await nblArchiverModule.runManually(injectedConfig);

    return res.json({
      success: true,
      jobName: 'nblArchiver',
      usedDaysOld: injectedConfig.BulkCopy.daysOld,
      execution: executionData || null,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

export default router;
