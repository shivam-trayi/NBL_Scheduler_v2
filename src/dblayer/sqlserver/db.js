import sql from 'mssql';
import { logError, logInfo } from '#common/logger.js';
import { getBulkCopyConfig } from '#schedulers/config.js';

let poolPromise = null;       // Normal operations (30s timeout)
let bulkPoolPromise = null;   // Bulk archival operations (300s timeout)
let cachedBulkCopyConfig = null;

// Builds SQL config from environment variables (normal pool)
function getSqlConfig() {
  return {
    server: process.env.MS_DATABASE_SERVER || 'localhost',
    port: parseInt(process.env.MS_DATABASE_PORT || '1433', 10),
    user: process.env.MS_DATABASE_USER,
    password: process.env.MS_DATABASE_PASSWORD,
    database: process.env.MS_DATABASE_DATABASE,
    connectionTimeout: 30000,
    requestTimeout: 30000,
    cancelTimeout: 30000,
    driver: 'msnodesqlv8',
    options: {
      trustServerCertificate: true,
    },
    pool: {
      max: 10,
      min: 0,
      idleTimeoutMillis: 30000,
    },
  };
}

// Builds SQL config for bulk archival pool (extended timeouts from config)
async function getBulkSqlConfig() {
  const bulkCopyConfig = await getCachedBulkCopyConfig();
  return {
    server: process.env.MS_DATABASE_SERVER || 'localhost',
    port: parseInt(process.env.MS_DATABASE_PORT || '1433', 10),
    user: process.env.MS_DATABASE_USER,
    password: process.env.MS_DATABASE_PASSWORD,
    database: process.env.MS_DATABASE_DATABASE,
    connectionTimeout: bulkCopyConfig.connectionTimeout || 300000,
    requestTimeout: bulkCopyConfig.requestTimeout || 300000,
    cancelTimeout: bulkCopyConfig.requestTimeout || 300000,
    driver: 'msnodesqlv8',
    options: {
      trustServerCertificate: true,
    },
    pool: {
      max: 10,
      min: 0,
      idleTimeoutMillis: 300000,
    },
  };
}

// ─── Public API ──────────────────────────────────────────────────────────────

/** Execute a stored procedure on the normal pool (30s timeout) */
export const callStoredProcedure = async (procName, params = []) =>
  executeStoredProcedure(procName, params);

/** Execute a stored procedure on the bulk pool (300s timeout) — for archival operations */
export async function callBulkCopyStoredProcedure(procName, params = []) {
  const bulkCopyConfig = await getCachedBulkCopyConfig();
  return executeBulkStoredProcedure(procName, params, bulkCopyConfig.requestTimeout || 300000);
}

/** Close both pools — call on shutdown or test teardown */
export async function closePool() {
  if (poolPromise) {
    const pool = await poolPromise;
    await pool.close();
    poolPromise = null;
    logInfo('SQL Server connection pool closed (normal).');
  }
  if (bulkPoolPromise) {
    const pool = await bulkPoolPromise;
    await pool.close();
    bulkPoolPromise = null;
    logInfo('SQL Server connection pool closed (bulk).');
  }
}

/** Clear cached bulk config — useful for tests */
export function clearBulkCopyConfigCache() {
  cachedBulkCopyConfig = null;
  logInfo('BulkCopy configuration cache cleared.');
}

// ─── Private helpers ─────────────────────────────────────────────────────────

async function executeStoredProcedure(procName, params = [], timeout) {
  const pool = await getPool();
  const request = createRequest(pool, params, timeout);
  return request.execute(procName);
}

async function executeBulkStoredProcedure(procName, params = [], timeout) {
  const pool = await getBulkPool();
  const request = createRequest(pool, params, timeout);
  return request.execute(procName);
}

async function getCachedBulkCopyConfig() {
  if (!cachedBulkCopyConfig) {
    cachedBulkCopyConfig = await getBulkCopyConfig();
    logInfo('BulkCopy configuration cached.');
  }
  return cachedBulkCopyConfig;
}

// Singleton getter — normal pool
async function getPool() {
  if (!poolPromise) {
    const config = getSqlConfig();
    poolPromise = sql.connect(config);
    (await poolPromise).on('error', (err) => logError('SQL Pool error: ' + err));
    logInfo('Connected to SQL Server (normal pool).');
  }
  return poolPromise;
}

// Singleton getter — bulk pool
async function getBulkPool() {
  if (!bulkPoolPromise) {
    const config = await getBulkSqlConfig();
    bulkPoolPromise = sql.connect(config);
    (await bulkPoolPromise).on('error', (err) => logError('SQL Bulk Pool error: ' + err));
    logInfo('Connected to SQL Server (bulk pool).');
  }
  return bulkPoolPromise;
}

// Build a mssql request, bind params, optionally set timeout
function createRequest(pool, params = [], timeout) {
  const request = pool.request();
  if (typeof timeout === 'number') {
    request.timeout = timeout;
  }
  if (params && params.length) {
    for (const p of params) {
      request.input(p.name, p.type, p.value);
    }
  }
  return request;
}
