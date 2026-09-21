import { describe, it, expect } from 'vitest';
import { createConfiguredJob } from '../../../src/schedulers/core/jobFactory.js';

const validConfig = {
  jobs: {
    nblArchiver: {
      isEnabled: true,
      maxConcurrency: 1,
      retries: 2,
      cronType: 'Repetitive',
      date: null,
      cron: '30 5 * * *',
    },
  },
};

describe('createConfiguredJob', () => {
  it('should return a configured job when jobConfig and jobLogic exist', async () => {
    const jobLogic = async () => 'ran';
    const getConfiguredJob = createConfiguredJob('nblArchiver', jobLogic);
    const job = await getConfiguredJob(validConfig);
    expect(job.jobName).toBe('nblArchiver');
    expect(typeof job.fn).toBe('function');
    await expect(job.fn()).resolves.toBe('ran');
    expect(job.isEnabled).toBe(true);
    expect(job.cron).toBe('30 5 * * *');
  });

  it('should throw if jobConfig is missing from config', async () => {
    const jobLogic = async () => 'ran';
    const getConfiguredJob = createConfiguredJob('missingJob', jobLogic);
    await expect(getConfiguredJob(validConfig)).rejects.toThrow(/Missing configuration/);
  });

  it('should throw if jobLogic is null', async () => {
    const getConfiguredJob = createConfiguredJob('nblArchiver', null);
    await expect(getConfiguredJob(validConfig)).rejects.toThrow(
      /supplied job function is null or undefined/
    );
  });
});
