export interface Sound {
  start(): void;
  stop(): void;
  isPlaying(): boolean;
  setFrequency(frequency: number): void;
  setVolume(volume: number): void;
}
