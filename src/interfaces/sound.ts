export interface Sound {
  enable(): void;
  stop(): void;
  reset(): void;
  refresh(soundLength: number): void;
  setTimer(timer: number): void;
  setBuffer(buffer: Uint8Array): void;
  setPitch(pitch: number): void;
  setVolume(volume: number): void;
}
