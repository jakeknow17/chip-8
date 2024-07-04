import { Timer } from "./interfaces/timer.js"

export class TimeoutTimer implements Timer {
  static readonly FRAMES_PER_SECOND = 60;
  static readonly INTERVAL = 1000 / TimeoutTimer.FRAMES_PER_SECOND;

  private isStarted = false;
  private ticksPerFrame: number = 8;
  private tickCallback: () => void = () => { };
  private drawCallback: () => void = () => { };
  private timerCallback: () => void = () => { };

  private startTime: number = 0;
  private lastTime: number = 0;

  constructor() {
    this.loop = this.loop.bind(this);
  }

  start(): void {
    this.isStarted = true;
    this.lastTime = performance.now();
    this.startTime = this.lastTime + TimeoutTimer.INTERVAL / 2;
    setTimeout(this.loop, TimeoutTimer.INTERVAL);
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

  setTimerCallback(fun: () => void): void {
    this.timerCallback = fun;
  }

  setTicksPerFrame(ticks: number): void {
    this.lastTime = performance.now();
    this.startTime = this.lastTime + TimeoutTimer.INTERVAL / 2;
    this.ticksPerFrame = ticks;
  }

  private loop(): void {
    this.lastTime = performance.now();

    for (let frames = 0; (TimeoutTimer.INTERVAL < this.lastTime - this.startTime) && frames < 2; this.startTime += TimeoutTimer.INTERVAL, frames++) {
      for (let i = 0; i < this.ticksPerFrame; i++) {
        this.tickCallback();
      }
      this.timerCallback();
    }
    this.drawCallback();

    setTimeout(this.loop, TimeoutTimer.INTERVAL);
  }
}
