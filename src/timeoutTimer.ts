import { Timer } from "./interfaces/timer.js"

export class TimeoutTimer implements Timer {
  static readonly FRAMES_PER_SECOND = 60;

  private isStarted = false;
  private ticksPerFrame: number = 8;
  private tickCallback: () => void = () => { };
  private drawCallback: () => void = () => { };

  private startTime: number = 0;
  private framesFromStart: number = 0;

  constructor() {
    this.loop = this.loop.bind(this);
  }

  start(): void {
    this.isStarted = true;
    this.framesFromStart = 0;
    this.startTime = performance.now();
    const interval = 1000 / TimeoutTimer.FRAMES_PER_SECOND;
    setTimeout(this.loop, interval);
  }

  stop(): void {
    this.isStarted = false;
  }

  isRunning(): boolean {
    return this.isStarted;
  }

  setTickCallback(fun: () => void): void {
    this.tickCallback = fun;
  }

  setDrawCallback(fun: () => void): void {
    this.drawCallback = fun;
  }

  setTicksPerFrame(ticks: number): void {
    this.framesFromStart = 0;
    this.startTime = performance.now();
    this.ticksPerFrame = ticks;
  }

  private loop(): void {
    const currTime = performance.now();
    const deltaTime = currTime - this.startTime;
    const interval = 1000 / TimeoutTimer.FRAMES_PER_SECOND;

    while (this.isStarted && (deltaTime / interval) > this.framesFromStart) {
      for (let i = 0; i < this.ticksPerFrame; i++) {
        this.tickCallback();
      }
      this.framesFromStart++;
      this.drawCallback();
    }

    setTimeout(this.loop, interval);
  }
}
