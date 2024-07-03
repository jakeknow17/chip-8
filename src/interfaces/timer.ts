export interface Timer {
  start(): void;
  stop(): void;
  isRunning(): boolean;
  setTickCallback(fun: () => void): void;
  setDrawCallback(fun: () => void): void;
  setTicksPerFrame(ticks: number): void;
}
