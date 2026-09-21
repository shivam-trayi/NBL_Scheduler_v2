import { callStoredProcedure } from '#dblayer/sqlserver/db.js';
import { logError } from '#common/logger.js';
import { ARCHIVAL_STATUS_COLUMNS } from '#dblayer/sqlserver/bulkOp/constants/archivalStatusColumns.js';
import sql from 'mssql';

/**
 * Upserts archival status for a given session + table.
 * Calls dbo.usp_UpsertArchivalStatus stored procedure.
 *
 * @param {Object} params
 * @param {string} params.sessionId
 * @param {Date}   params.archivalDate
 * @param {string} params.tableName
 * @param {number} params.totalRecords
 * @param {number} params.recordsMoved
 * @param {string} params.status       — 'Started' | 'Completed' | 'Failed'
 * @param {string|null} params.errorMessage
 */
export async function upsertArchivalStatus({
  sessionId,
  archivalDate,
  tableName,
  totalRecords,
  recordsMoved,
  status,
  errorMessage,
}) {
  try {
    await callStoredProcedure('dbo.usp_UpsertArchivalStatus', [
      { name: ARCHIVAL_STATUS_COLUMNS.SESSION_ID,    type: sql.VarChar(64),   value: sessionId },
      { name: ARCHIVAL_STATUS_COLUMNS.ARCHIVAL_DATE, type: sql.DateTime,      value: archivalDate },
      { name: ARCHIVAL_STATUS_COLUMNS.TABLE_NAME,    type: sql.VarChar(128),  value: tableName },
      { name: ARCHIVAL_STATUS_COLUMNS.TOTAL_RECORDS, type: sql.Int,           value: totalRecords },
      { name: ARCHIVAL_STATUS_COLUMNS.RECORDS_MOVED, type: sql.Int,           value: recordsMoved },
      { name: ARCHIVAL_STATUS_COLUMNS.STATUS,        type: sql.VarChar(32),   value: status },
      { name: ARCHIVAL_STATUS_COLUMNS.ERROR_MESSAGE, type: sql.VarChar(4000), value: errorMessage || null },
    ]);
  } catch (err) {
    logError('Failed to upsert archival status: ' + err.message);
  }
}
