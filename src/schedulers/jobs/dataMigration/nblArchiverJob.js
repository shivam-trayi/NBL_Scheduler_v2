import { callStoredProcedure, callBulkCopyStoredProcedure } from '#dblayer/sqlserver/db.js';
import sql from 'mssql';
import { logInfo, logError } from '#common/logger.js';
import { getBulkCopyConfig } from '#schedulers/config.js';
import { createConfiguredJob } from '#schedulers/core/jobFactory.js';
import { sendJobNotification } from '#common/mailer.js';

const defaultRecipients = process.env.EMAIL_RECIPIENTS
  ? process.env.EMAIL_RECIPIENTS.split(',').map((e) => e.trim())
  : [];

/**
 * Core NBL Archiver Job Logic.
 *
 * Flow:
 * 1. Get total count of eligible surveys (older than @DaysOld days)
 * 2. Loop in chunks (ChunkSize at a time):
 *    a. Fetch next chunk of eligible SurveyGUIDs
 *    b. Build mssql.Table TVP (SurveyIdList)
 *    c. Call dbo.ArchiveSurveyDataBySurveyIds — transactional stored proc that:
 *       - Copies child tables: participants, participantsredirects, participantreply,
 *         surveydemomapping, demorangemapping, allocatedvendor
 *       - Copies master table: surveys
 *       - Deletes all copied rows from source in same transaction
 * 3. Send email notification on completion or failure
 *
 * @param {object} injectedConfig — the loaded config object (may be overridden for manual runs)
 * @returns {{ status: string, message: string }}
 */
const nblArchiverJobLogic = async (injectedConfig) => {
  logInfo('NBL Archiver job started.');

  let bulkCopy;
  if (injectedConfig && injectedConfig.BulkCopy) {
    bulkCopy = injectedConfig.BulkCopy;
    logInfo('Using injected BulkCopy config: ' + JSON.stringify(bulkCopy));
  } else {
    bulkCopy = await getBulkCopyConfig();
    logInfo('Using config.json BulkCopy config: ' + JSON.stringify(bulkCopy));
  }

  try {
    // Step 1: Get total eligible count
    const countResult = await callStoredProcedure('dbo.usp_GetEligibleSurveyCount', [
      { name: 'DaysOld', type: sql.Int, value: bulkCopy.daysOld },
    ]);
    const totalEligible =
      countResult && countResult.recordset && countResult.recordset.length > 0
        ? Object.values(countResult.recordset[0])[0]
        : 0;
    logInfo(`Total eligible surveys to archive: ${totalEligible}`);

    if (totalEligible === 0) {
      logInfo('No surveys eligible for archival. Job complete.');
      await sendJobNotification(
        'NBL Archiver Job Completed',
        'No surveys were eligible for archival.',
        defaultRecipients
      );
      return {
        status: 'COMPLETED',
        message: 'No surveys eligible for archival.',
      };
    }

    let totalProcessed = 0;
    let chunkNumber = 1;

    // Step 2: Chunk loop
    while (totalProcessed < totalEligible) {
      // Fetch next chunk of eligible SurveyGUIDs
      const chunkedResult = await callStoredProcedure('dbo.usp_GetEligibleSurveyIds', [
        { name: 'DaysOld', type: sql.Int, value: bulkCopy.daysOld },
        { name: 'ChunkSize', type: sql.Int, value: bulkCopy.chunkSize },
      ]);

      const surveyIds =
        chunkedResult && chunkedResult.recordset && chunkedResult.recordset.length > 0
          ? chunkedResult.recordset.map((row) => row.SurveyId)
          : [];

      if (surveyIds.length === 0) {
        logInfo(
          chunkNumber === 1
            ? 'No SurveyIds found for archival.'
            : `All eligible SurveyIds processed. Total processed: ${totalProcessed}`
        );
        break;
      }

      logInfo(
        `Chunk #${chunkNumber} — chunk size: ${bulkCopy.chunkSize}, found ${surveyIds.length} SurveyIds.`
      );
      logInfo(`SurveyIds in this chunk: ${JSON.stringify(surveyIds)}`);

      // Build TVP (Table-Valued Parameter)
      const tvp = new sql.Table();
      tvp.columns.add('SurveyId', sql.VarChar(64));
      for (const id of surveyIds) {
        tvp.rows.add(id);
      }

      // Step 3: Call transactional archive proc (copies + deletes in one transaction)
      logInfo(`Calling dbo.ArchiveSurveyDataBySurveyIds for chunk #${chunkNumber}...`);
      await callBulkCopyStoredProcedure('dbo.ArchiveSurveyDataBySurveyIds', [
        { name: 'SurveyId', type: sql.TVP('dbo.SurveyIdList'), value: tvp },
      ]);
      logInfo(`Chunk #${chunkNumber} archived successfully.`);

      totalProcessed += surveyIds.length;
      chunkNumber++;
    }

    logInfo(`NBL Archiver job completed. Total surveys archived: ${totalProcessed}`);

    await sendJobNotification(
      'NBL Archiver Job Completed',
      `Total surveys archived: ${totalProcessed} of ${totalEligible} eligible.`,
      defaultRecipients
    );

    return {
      status: 'COMPLETED',
      message: `Total surveys archived: ${totalProcessed} of ${totalEligible} eligible.`,
    };
  } catch (err) {
    logError('NBL Archiver job failed: ' + err.message);
    logError(err.stack);

    await sendJobNotification(
      'NBL Archiver Job Failed',
      `Error during archival.\nError: ${err.message}`,
      defaultRecipients
    );

    return {
      status: 'FAILED',
      message: `Error during archival: ${err.message}`,
    };
  }
};

export default {
  getConfiguredJob: createConfiguredJob('nblArchiver', nblArchiverJobLogic),

  // Manual trigger — called from HTTP route
  runManually: async (injectedConfig) => {
    return nblArchiverJobLogic(injectedConfig);
  },
};
