import { describe, it, expect, afterAll } from 'vitest';
import { executeQuery, closePool } from '#dblayer/sqlserver/db.js';
import sql from 'mssql';

/**
 * Integration test — verifies staging_neuralbyt_archive DB and all required tables exist.
 * Requires a real SQL Server connection. Run manually, not in CI.
 * Set NODE_ENV=integration to enable.
 */
describe('Database Integration: staging_neuralbyt_archive tables existence', () => {
  afterAll(async () => {
    await closePool();
  });

  it('should verify that staging_neuralbyt_archive database exists', async () => {
    const result = await executeQuery(
      "SELECT name FROM sys.databases WHERE name = 'staging_neuralbyt_archive'"
    );
    expect(result.recordset.length).toBe(1);
  });

  const tables = [
    'surveys',
    'participants',
    'participantsredirects',
    'participantreply',
    'surveydemomapping',
    'demorangemapping',
    'allocatedvendor',
    'ArchivalStatus',
  ];

  tables.forEach((table) => {
    it(`should verify staging_neuralbyt_archive.dbo.${table} exists`, async () => {
      const result = await executeQuery(
        `SELECT 1 FROM staging_neuralbyt_archive.INFORMATION_SCHEMA.TABLES
         WHERE TABLE_SCHEMA = 'dbo' AND TABLE_NAME = '${table}'`
      );
      expect(result.recordset.length).toBe(1);
    });
  });
});
