import { describe, it, expect, afterAll } from 'vitest';
import { callStoredProcedure, closePool } from '#dblayer/sqlserver/db.js';
import sql from 'mssql';

/**
 * Integration test — verifies neuralbyt_archive DB and all required tables exist.
 * Requires a real SQL Server connection. Run manually, not in CI.
 * Set NODE_ENV=integration to enable.
 */
describe('Database Integration: neuralbyt_archive tables existence', () => {
  afterAll(async () => {
    await closePool();
  });

  it('should verify that neuralbyt_archive database exists', async () => {
    const result = await callStoredProcedure(
      "SELECT name FROM sys.databases WHERE name = 'neuralbyt_archive'"
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
    it(`should verify neuralbyt_archive.dbo.${table} exists`, async () => {
      const result = await callStoredProcedure(
        `SELECT 1 FROM neuralbyt_archive.INFORMATION_SCHEMA.TABLES
         WHERE TABLE_SCHEMA = 'dbo' AND TABLE_NAME = '${table}'`
      );
      expect(result.recordset.length).toBe(1);
    });
  });
});
