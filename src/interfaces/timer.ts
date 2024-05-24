export interface Timer {
  start(): void;
  stop(): void;
  isRunning(): boolean;
  setCallback(fun: () => void): void;
  setTicksPerSecond(ticks: number): void;
}
