import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { logError } from '../common/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CONFIG_PATH = path.resolve(__dirname, 'config.json');

export async function loadSchedulerConfig() {
  try {
    const configData = await fs.readFile(CONFIG_PATH, 'utf-8');
    const config = JSON.parse(configData);
    if (!config.jobs || Object.keys(config.jobs).length === 0) {
      logError('No jobs found in config.json. Scheduler cannot start.');
      throw new Error('No jobs found in config.json. Scheduler cannot start.');
    }
    return config;
  } catch (err) {
    logError('Failed to load config.json or no jobs to schedule. Scheduler cannot start. ' + err);
    throw new Error(
      'Failed to load config.json or no jobs to schedule. Scheduler cannot start.',
      { cause: err }
    );
  }
}

export async function getDatabaseDetails() {
  const config = await loadSchedulerConfig();
  return config.DatabaseDetails;
}

export async function getBulkCopyConfig() {
  const config = await loadSchedulerConfig();
  return config.BulkCopy;
}

export async function getNblArchiverJobConfig() {
  const config = await loadSchedulerConfig();
  return config.jobs && config.jobs.nblArchiver;
}
