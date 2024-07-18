import { RunnableEmulator } from "./interfaces/runnableEmulator";

import { Emulator } from "./emulator";
import { IntervalTimer } from "./timeoutTimer";
import { BrowserKeyboard } from "./web/browserKeyboard";
import { AudioWorkletSound } from "./web/audioWorkletSound";
import { CanvasDisplay } from "./web/canvasDisplay";
import { WebLogger } from "./web/webLogger";
import { LogLevel } from "./abstract/logger";

export class WebEmulator implements RunnableEmulator {
  emulator: Emulator;

  constructor(canvas: HTMLCanvasElement) {
    this.emulator = new Emulator(
      new CanvasDisplay(canvas),
      new IntervalTimer(),
      new BrowserKeyboard(),
      new AudioWorkletSound(),
      new WebLogger(LogLevel.OFF)
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
