export interface RunnableEmulator {
  load(rom: Uint8Array): void;
  setEmulationSpeed(ticksPerSecond: number): void;
  setSoundFrequency(freqHz: number): void;
  setSoundVolume(volume: number): void;
  reset(): void;
  start(): void;
  pause(): void;
  continue(): void;
}
