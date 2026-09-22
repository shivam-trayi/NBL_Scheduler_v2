import { executeQuery, closePool } from '#dblayer/sqlserver/db.js';

/**
 * Database Integration Test — NBL
 * Verifies basic SQL Server connection and surveys table existence.
 * Requires .env with MS_DATABASE_* credentials.
 * Run manually: npx vitest run tests/dblayer/sqlserver/sqlserver.integration.test.js
 */
describe('Database Integration: staging_neuralbyt.dbo.surveys table', () => {
  afterAll(async () => {
    await closePool();
  });

  it('should connect to the database and verify dbo.surveys table exists', async () => {
    const result = await executeQuery(
      `SELECT 1 FROM INFORMATION_SCHEMA.TABLES
       WHERE TABLE_CATALOG = 'staging_neuralbyt'
         AND TABLE_SCHEMA = 'dbo'
         AND TABLE_NAME = 'surveys'`
    );
    // mssql returns { recordset: [...] }
    expect(result.recordset.length).toBe(1);
  });
});
