import fs from 'fs';
import path  from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logsDir = path.join(__dirname, '..', 'logs');

if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, {recursive: true});
}

const LEVELS = {
    ERROR: 'ERROR',
    WARN: 'WARN',
    INFO: 'INFO',
    DEBUG: 'DEBUG'
};

/**
 * Get current timestamp in ISO format
 * @returns {string} Formatted timestamp
 */

function getTimestamp() {
    return new Date().toISOString();
}

/**
 * Write log to console and file
 * @param {string} level - Log level
 * @param {string} message - Log message
 * @param {Object} [data] - Additional data to log
 */

function log(level, message, data = null) {
    const timestamp = getTimestamp();
    const dataString = data ? JSON.stringify(data, null, 2) : '';

    // Format log entry
    const logEntry = `[${timestamp}] [${level}] ${message} ${dataString}`.trim() + '\n';
  
    // Log to console with colors
    let consoleMethod = 'log';
    let consoleColor = '\x1b[0m'; // Reset color
    
    switch (level) {
      case LEVELS.ERROR:
        consoleMethod = 'error';
        consoleColor = '\x1b[31m'; // Red
        break;
      case LEVELS.WARN:
        consoleMethod = 'warn';
        consoleColor = '\x1b[33m'; // Yellow
        break;
      case LEVELS.INFO:
        consoleMethod = 'info';
        consoleColor = '\x1b[36m'; // Cyan
        break;
      case LEVELS.DEBUG:
        consoleMethod = 'debug';
        consoleColor = '\x1b[90m'; // Gray
        break;
    }
    
    console[consoleMethod](`${consoleColor}${logEntry}\x1b[0m`);

    // Determine log file based on level
    let logFile = 'combined.log';
    if (level === LEVELS.ERROR) {
    // Also log errors to error log
      fs.appendFileSync(path.join(logsDir, 'error.log'), logEntry);
    }

    // Append to combined log
    fs.appendFileSync(path.join(logsDir, logFile), logEntry);
}

// Logger object
const logger = {
    error: (message, data) => log(LEVELS.ERROR, message, data),
    warn: (message, data) => log(LEVELS.WARN, message, data),
    info: (message, data) => log(LEVELS.INFO, message, data),
    debug: (message, data) => log(LEVELS.DEBUG, message, data)
};

export default logger;
