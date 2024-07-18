export enum LogLevel {
  DEBUG,
  INFO,
  WARN,
  ERROR,
  OFF
}

export abstract class Logger {
  protected currentLevel: LogLevel;
  protected logToConsole: boolean;

  constructor(level: LogLevel = LogLevel.INFO, logToConsole: boolean = true) {
    this.currentLevel = level;
    this.logToConsole = logToConsole;
  }

  abstract log(level: LogLevel, message: string): void;

  setLevel(level: LogLevel) {
    this.currentLevel = level;
  }

  enableConsoleLogging(enable: boolean) {
    this.logToConsole = enable;
  }

  debug(message: string) {
    this.log(LogLevel.DEBUG, message);
  }

  info(message: string) {
    this.log(LogLevel.INFO, message);
  }

  warn(message: string) {
    this.log(LogLevel.WARN, message);
  }

  error(message: string) {
    this.log(LogLevel.ERROR, message);
  }
}
