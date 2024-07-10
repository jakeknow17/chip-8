import { RunnableEmulator } from "./interfaces/runnableEmulator";

import { Emulator } from "./emulator";
import { TimeoutTimer } from "./timeoutTimer";
import { BrowserKeyboard } from "./browser/browserKeyboard";
import { AudioWorkletSound } from "./browser/audioWorkletSound";
import { CanvasDisplay } from "./browser/canvasDisplay";

export class WebEmulator implements RunnableEmulator {
  emulator: Emulator;

  constructor(canvas: HTMLCanvasElement) {
    this.emulator = new Emulator(
      new CanvasDisplay(canvas),
      new TimeoutTimer(),
      new BrowserKeyboard(),
      new AudioWorkletSound()
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
