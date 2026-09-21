import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { callStoredProcedure, closePool } from '#dblayer/sqlserver/db.js';
import { getBulkCopyConfig } from '#schedulers/config.js';
import sql from 'mssql';

/**
 * Integration tests for NBL archiver job bulk copy logic.
 * Requires a real SQL Server connection with neuralbyt DB.
 * Run manually, not in CI pipeline.
 */
describe('Integration: nblArchiverJob BulkCopy logic', () => {
  let bulkCopy;

  beforeAll(async () => {
    bulkCopy = await getBulkCopyConfig();
  });

  afterAll(async () => {
    await closePool();
  });

  it('should return the total eligible survey count for configured daysOld', async () => {
    const countResult = await callStoredProcedure('dbo.usp_GetEligibleSurveyCount', [
      { name: 'DaysOld', type: sql.Int, value: bulkCopy.daysOld },
    ]);
    expect(countResult && countResult.recordset && countResult.recordset.length > 0).toBe(true);
    const count = Object.values(countResult.recordset[0])[0];
    expect(typeof count).toBe('number');
    console.log(`Total eligible surveys: ${count}`);
  });

  it('should fetch a chunk of eligible SurveyIds within configured chunkSize', async () => {
    const chunkedResult = await callStoredProcedure('dbo.usp_GetEligibleSurveyIds', [
      { name: 'DaysOld', type: sql.Int, value: bulkCopy.daysOld },
      { name: 'ChunkSize', type: sql.Int, value: bulkCopy.chunkSize },
    ]);
    const surveyIds =
      chunkedResult && chunkedResult.recordset && chunkedResult.recordset.length > 0
        ? chunkedResult.recordset.map((row) => row.SurveyId)
        : [];
    console.log(`Chunk SurveyIds count: ${surveyIds.length}`);
    expect(Array.isArray(surveyIds)).toBe(true);
    expect(surveyIds.length).toBeLessThanOrEqual(bulkCopy.chunkSize);
  });

  it('should confirm eligible surveys exist in the source surveys table', async () => {
    const chunkedResult = await callStoredProcedure('dbo.usp_GetEligibleSurveyIds', [
      { name: 'DaysOld', type: sql.Int, value: bulkCopy.daysOld },
      { name: 'ChunkSize', type: sql.Int, value: bulkCopy.chunkSize },
    ]);
    const surveyIds =
      chunkedResult && chunkedResult.recordset && chunkedResult.recordset.length > 0
        ? chunkedResult.recordset.map((row) => row.SurveyId)
        : [];

    if (surveyIds.length === 0) {
      console.log('No eligible surveys found — skipping source verification.');
      return;
    }

    // Build parameterized IN clause
    const params = surveyIds.map((id, idx) => ({
      name: `id${idx}`,
      type: sql.VarChar(64),
      value: id,
    }));
    const inClause = surveyIds.map((_, idx) => `@id${idx}`).join(',');

    const srcResult = await callStoredProcedure(
      `SELECT SurveyGUID FROM dbo.surveys WHERE SurveyGUID IN (${inClause})`,
      params
    );
    expect(srcResult.recordset.length).toBe(surveyIds.length);
  });

  // Skipped by default — requires empty archive destination to avoid duplicate key errors
  it.skip('should archive all eligible surveys end-to-end using real job logic', async () => {
    const nblArchiverModule = await import('#schedulers/jobs/dataMigration/nblArchiverJob.js');
    const config = await import('#schedulers/config.js').then((m) => m.loadSchedulerConfig());
    const result = await nblArchiverModule.default.runManually(config);
    expect(result.status).toBe('COMPLETED');
    console.log(result.message);
  });
});
