import { RunnableEmulator } from "./interfaces/runnableEmulator.js";
import terminalKit from "terminal-kit";

import { Emulator } from "./emulator.js";
import { IntervalTimer } from "./timeoutTimer.js";
import { TerminalKeyboard } from "./node/terminalKeyboard.js";
import { TerminalDisplay } from "./node/terminalDisplay.js";
import { SilentSound } from "./node/silentSound.js";
import { NodeLogger } from "./node/nodeLogger.js";
import { LogLevel } from "./abstract/logger.js";

export class TerminalEmulator implements RunnableEmulator {
  emulator: Emulator;

  constructor() {
    const logger = new NodeLogger();
    logger.enableConsoleLogging(false);
    logger.setLevel(LogLevel.OFF);
    logger.enableFileLogging(false, "./log.txt");

    const term = terminalKit.createTerminal();

    this.emulator = new Emulator(
      new TerminalDisplay(term),
      new IntervalTimer(),
      new TerminalKeyboard(term),
      new SilentSound(),
      logger
    );
  };

  setLogLevel(level: LogLevel) {
    this.emulator.setLogLevel(level);
  }

  load(rom: Uint8Array): void {
    this.emulator.load(rom);
  }

  setEmulationSpeed(ticksPerSecond: number) {
    this.emulator.setEmulationSpeed(ticksPerSecond);
  }

  setSoundFrequency(freqHz: number) {
    this.emulator.setSoundFrequency(freqHz);
  }

  setSoundVolume(volume: number) {
    this.emulator.setSoundVolume(volume);
  }

  reset(): void {
    this.emulator.reset();
  }

  start(): void {
    this.emulator.start();
  }

  pause(): void {
    this.emulator.pause();
  }

  continue(): void {
    this.emulator.continue();
  }
}
