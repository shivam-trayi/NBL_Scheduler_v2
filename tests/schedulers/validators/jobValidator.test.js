import { describe, it, expect } from 'vitest';
import { validateJob } from '../../../src/schedulers/validators/jobValidator.js';
import { JOB_TYPE_FIXED_DATE_TIME, JOB_TYPE_REPETITIVE } from '../../../src/schedulers/constants/jobTypes.js';

describe('validateJob', () => {
  it('returns isSuccess: false with info for a disabled job', () => {
    const result = validateJob({ isEnabled: false, jobName: 'nblArchiver' });
    expect(result.isSuccess).toBe(false);
    expect(result.messageType).toBe('info');
  });

  it('warns if FixedDateTime job has no date', () => {
    const result = validateJob({ isEnabled: true, jobName: 'nblArchiver', cronType: JOB_TYPE_FIXED_DATE_TIME });
    expect(result.isSuccess).toBe(false);
    expect(result.messageType).toBe('warn');
    expect(result.message).toMatch(/no date set/);
  });

  it('warns if FixedDateTime job has an invalid date', () => {
    const result = validateJob({ isEnabled: true, jobName: 'nblArchiver', cronType: JOB_TYPE_FIXED_DATE_TIME, date: 'not-a-date' });
    expect(result.isSuccess).toBe(false);
    expect(result.messageType).toBe('warn');
    expect(result.message).toMatch(/invalid date/);
  });

  it('warns if FixedDateTime job has a past date', () => {
    const past = new Date(Date.now() - 100000).toISOString();
    const result = validateJob({ isEnabled: true, jobName: 'nblArchiver', cronType: JOB_TYPE_FIXED_DATE_TIME, date: past });
    expect(result.isSuccess).toBe(false);
    expect(result.messageType).toBe('warn');
    expect(result.message).toMatch(/past date/);
  });

  it('warns if Repetitive job has no cron expression', () => {
    const result = validateJob({ isEnabled: true, jobName: 'nblArchiver', cronType: JOB_TYPE_REPETITIVE });
    expect(result.isSuccess).toBe(false);
    expect(result.messageType).toBe('warn');
    expect(result.message).toMatch(/no cron expression/);
  });

  it('succeeds for a valid FixedDateTime job with future date', () => {
    const future = new Date(Date.now() + 100000).toISOString();
    const result = validateJob({ isEnabled: true, jobName: 'nblArchiver', cronType: JOB_TYPE_FIXED_DATE_TIME, date: future });
    expect(result.isSuccess).toBe(true);
  });

  it('succeeds for a valid Repetitive job with cron expression', () => {
    const result = validateJob({ isEnabled: true, jobName: 'nblArchiver', cronType: JOB_TYPE_REPETITIVE, cron: '30 5 * * *' });
    expect(result.isSuccess).toBe(true);
  });
});
