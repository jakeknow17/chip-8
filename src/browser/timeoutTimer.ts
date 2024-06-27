import { Timer } from "../interfaces/timer.js"

export class TimeoutTimer implements Timer {
  private isStarted = false;
  private ticksPerSecond: number = 60;
  private callback: () => void = () => { };

  private startTime: number = 0;
  private ticksFromStart: number = 0;

  constructor(callback?: () => void) {
    if (callback)
      this.callback = callback;

    this.loop = this.loop.bind(this);
  }

  start(): void {
    this.isStarted = true;
    this.ticksFromStart = 0;
    this.startTime = performance.now();
    const interval = Math.floor(1000 / this.ticksPerSecond);
    setTimeout(this.loop, interval / 2);
  }

  stop(): void {
    this.isStarted = false;
  }

  isRunning(): boolean {
    return this.isStarted;
  }

  setCallback(fun: () => void): void {
    this.callback = fun;
  }

  setTicksPerSecond(ticks: number): void {
    this.ticksPerSecond = ticks;
  }

  private loop(): void {
    const currTime = performance.now();
    const deltaTime = currTime - this.startTime;
    const interval = Math.floor(1000 / this.ticksPerSecond);

    while ((deltaTime / interval) > this.ticksFromStart) {
      this.callback()
      this.ticksFromStart++;
    }

    if (this.isStarted)
      setTimeout(this.loop, interval / 2);
  }
}
