import { Logger, LogLevel } from '../abstract/logger';

export class NodeLogger extends Logger {
  private logToFile: boolean;
  private logFilePath: string | undefined;

  constructor(level: LogLevel = LogLevel.INFO, logToConsole: boolean = true, logToFile: boolean = false, logFilePath?: string) {
    super(level, logToConsole);
    this.logToFile = logToFile;
    if (logToFile && logFilePath) {
      this.logFilePath = logFilePath;
    }
  }

  enableFileLogging(enable: boolean, logFilePath?: string) {
    this.logToFile = enable;
    if (logFilePath) {
      this.logFilePath = logFilePath;
    }
  }

  log(level: LogLevel, message: string) {
    if (level < this.currentLevel) {
      return;
    }

    const levelStr = LogLevel[level];
    const logMessage = `[${new Date().toISOString()}] [${levelStr}] ${message}`;

    if (this.logToConsole) {
      console.log(logMessage);
    }

    if (this.logToFile && this.logFilePath) {
      const fs = require('fs');
      fs.appendFileSync(this.logFilePath, logMessage + '\n', 'utf8');
    }
  }
}
