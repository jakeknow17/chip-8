import { Logger, LogLevel } from '../abstract/logger';

export class WebLogger extends Logger {
  constructor(level: LogLevel = LogLevel.INFO, logToConsole: boolean = true) {
    super(level, logToConsole);
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
  }
}
