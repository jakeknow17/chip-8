import { BrowserKeyboard } from "./browser/browserKeyboard";
import { BrowserSound } from "./browser/browserSound";
import { CanvasDisplay } from "./browser/canvasDisplay";
import { TimeoutTimer } from "./timeoutTimer";
import { Emulator } from "./emulator";

interface RunnableEmulator {
  load(rom: Uint8Array): void;
  setEmulationSpeed(ticksPerSecond: number): void;
  setSoundFrequency(freqHz: number): void;
  setSoundVolume(volume: number): void;
  reset(): void;
  start(): void;
  pause(): void;
  continue(): void;
}

export class WebEmulator implements RunnableEmulator {
  emulator: Emulator;

  constructor(canvas: HTMLCanvasElement) {
    this.emulator = new Emulator(
      new CanvasDisplay(canvas),
      new TimeoutTimer(),
      new BrowserKeyboard(),
      new BrowserSound()
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
