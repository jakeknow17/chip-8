import { Timer } from "../interfaces/timer.js"

export class AnimationTimer implements Timer {
  private isStarted = false;
  private ticks: number = 60;
  private callback: () => void = () => { };
  private prevTime = 0;

  constructor(callback?: () => void) {
    if (callback)
      this.callback = callback;

    this.loop = this.loop.bind(this);
  }

  start(): void {
    this.isStarted = true;
    requestAnimationFrame(this.loop);
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
    this.ticks = ticks;
  }

  private loop(currTime: number): void {
    const deltaTime = currTime - (this.prevTime);
    const interval = 1000 / this.ticks;

    if (deltaTime >= interval) {
      this.callback()
      this.prevTime = currTime - (deltaTime % interval);
    }

    if (this.isStarted)
      requestAnimationFrame(this.loop);
  }
}
