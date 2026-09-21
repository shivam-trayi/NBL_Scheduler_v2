import { createLogger, format, transports } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dayjs from 'dayjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const loggerConfigPath = path.resolve(__dirname, 'loggerConfig.json');
const loggerConfig = JSON.parse(fs.readFileSync(loggerConfigPath, 'utf-8'));

function getDateFolder() {
  const pattern = loggerConfig.folderNamePattern || 'YYYY-MM-DD';
  return dayjs().format(pattern);
}

const logBaseDir = path.resolve(__dirname, loggerConfig.logLocation || '../../logs');
const dateFolder = getDateFolder();
const logDir = path.join(logBaseDir, dateFolder);
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(),
    format.printf(({ timestamp, level, message }) => {
      return `${timestamp} [${level.toUpperCase()}]: ${message}`;
    })
  ),
  transports: [
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.timestamp(),
        format.printf(({ timestamp, level, message }) => {
          return `${level}: [${timestamp}]: ${message}`;
        })
      ),
    }),
    new DailyRotateFile({
      filename: path.join(logDir, `nbl_archival_%DATE%.log`),
      datePattern: loggerConfig.fileNamePattern || 'YYYY_MM_DD',
      maxSize: loggerConfig.maxLogFileSize || '10m',
      level: 'info',
      zippedArchive: false,
    }),
  ],
});

logger.on('error', (err) => {
  console.error('Logger error:', err);
});

export function logInfo(message) {
  logger.info(message);
}

export function logWarn(message) {
  logger.warn(message);
}

export function logError(message) {
  logger.error(message);
}

export function logDebug(message) {
  logger.debug(message);
}

export function logTrace(message) {
  if (message instanceof Error) {
    logger.silly(`${message.message}\n${message.stack}`);
  } else {
    logger.silly(message);
  }
}

// Generic log dispatcher — accepts { message, messageType } object
export function log(messageObj) {
  if (!messageObj || !messageObj.message) return;
  const type = (messageObj.messageType || '').toLowerCase();
  switch (type) {
    case 'error':
      logError(messageObj.message);
      break;
    case 'warn':
    case 'warning':
      logWarn(messageObj.message);
      break;
    case 'debug':
      logDebug(messageObj.message);
      break;
    case 'trace':
      logTrace(messageObj.message);
      break;
    case 'info':
    default:
      logInfo(messageObj.message);
  }
}

logInfo('NBL Archiver logger initialized.');
