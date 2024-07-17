import { RunnableEmulator } from "./interfaces/runnableEmulator.js";

import { Emulator } from "./emulator.js";
import { IntervalTimer } from "./timeoutTimer.js";
import { TerminalKeyboard } from "./node/terminalKeyboard.js";
import { TerminalDisplay } from "./node/terminalDisplay.js";
import { SilentSound } from "./node/silentSound.js";


export class TerminalEmulator implements RunnableEmulator {
  emulator: Emulator;

  constructor() {
    this.emulator = new Emulator(
      new TerminalDisplay(),
      new IntervalTimer(),
      new TerminalKeyboard(),
      new SilentSound()
    );
  }; 

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
