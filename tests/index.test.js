import { describe, it, vi, expect, beforeEach, afterEach } from 'vitest';

const INDEX_PATH = '../index.js';

async function importIndex() {
  return await import(INDEX_PATH);
}

describe('index.js startup scenarios', () => {
  let loadSchedulerConfigMock, scheduleJobsMock, logErrorMock, processExitMock;

  beforeEach(() => {
    loadSchedulerConfigMock = vi.fn();
    scheduleJobsMock = vi.fn();
    logErrorMock = vi.fn();
    processExitMock = vi.fn();

    vi.resetModules();
    vi.doMock('../src/schedulers/config.js', () => ({ loadSchedulerConfig: loadSchedulerConfigMock }));
    vi.doMock('../src/schedulers/core/jobScheduler.js', () => ({ scheduleJobs: scheduleJobsMock }));
    vi.doMock('../src/common/logger.js', () => ({
      logError: logErrorMock,
      logInfo: vi.fn(),
      logWarn: vi.fn(),
      logDebug: vi.fn(),
      logTrace: vi.fn(),
      log: vi.fn(),
    }));
    vi.stubGlobal('process', { ...process, exit: processExitMock });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('starts successfully when config and jobs are valid', async () => {
    loadSchedulerConfigMock.mockResolvedValue({ jobs: { nblArchiver: {} } });
    scheduleJobsMock.mockResolvedValue([{ jobName: 'nblArchiver' }]);
    await importIndex();
    expect(logErrorMock).not.toHaveBeenCalled();
    expect(processExitMock).not.toHaveBeenCalled();
  });

  it('fails and logs error if job config is missing', async () => {
    loadSchedulerConfigMock.mockRejectedValue(new Error('Missing configuration for job'));
    await importIndex();
    expect(logErrorMock).toHaveBeenCalledWith(expect.stringMatching(/Application failed to start/));
    expect(processExitMock).toHaveBeenCalledWith(1);
  });

  it('fails and logs error if job logic/module is missing', async () => {
    loadSchedulerConfigMock.mockResolvedValue({ jobs: { nblArchiver: {} } });
    scheduleJobsMock.mockRejectedValue(new Error('supplied job function is null or undefined'));
    await importIndex();
    expect(logErrorMock).toHaveBeenCalledWith(expect.stringMatching(/Application failed to start/));
    expect(processExitMock).toHaveBeenCalledWith(1);
  });
});
