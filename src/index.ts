import { Emulator } from "./emulator";
import { TimeoutTimer } from "./timeoutTimer";

import { BrowserKeyboard } from "./browser/browserKeyboard";
// import { BrowserSound } from "./browser/browserSound";
import { AudioWorkletSound } from "./browser/audioWorkletSound";
import { CanvasDisplay } from "./browser/canvasDisplay";

// import { TerminalDisplay } from "./node/terminalDisplay";
// import { SilentSound } from "./node/silentSound";

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

// export class TerminalEmulator implements RunnableEmulator {
//   emulator: Emulator;
//
//   constructor() {
//     this.emulator = new Emulator(
//       new TerminalDisplay(),
//       new TimeoutTimer(),
//       new BrowserKeyboard(),
//       new SilentSound()
//     );
//   }; 
//
//   load(rom: Uint8Array): void {
//     this.emulator.load(rom);
//   }
//
//   setEmulationSpeed(ticksPerSecond: number) {
//     this.emulator.setEmulationSpeed(ticksPerSecond);
//   }
//
//   setSoundFrequency(freqHz: number) {
//     this.emulator.setSoundFrequency(freqHz);
//   }
//
//   setSoundVolume(volume: number) {
//     this.emulator.setSoundVolume(volume);
//   }
//
//   reset(): void {
//     this.emulator.reset();
//   }
//
//   start(): void {
//     this.emulator.start();
//   }
//
//   pause(): void {
//     this.emulator.pause();
//   }
//
//   continue(): void {
//     this.emulator.continue();
//   }
// }
