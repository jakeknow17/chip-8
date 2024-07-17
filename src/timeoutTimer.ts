import { Timer } from "./interfaces/timer.js"

export class IntervalTimer implements Timer {
  static readonly FRAMES_PER_SECOND = 60;
  static readonly INTERVAL = 1000 / IntervalTimer.FRAMES_PER_SECOND;

  private isStarted = false;
  private ticksPerFrame: number = 8;
  private tickCallback: () => void = () => { };
  private drawCallback: () => void = () => { };
  private timerCallback: () => void = () => { };
  private audioRefreshCallback: (soundLength: number) => void = (_) => { };

  private startTime: number = 0;
  private lastTime: number = 0;

  private intervalId: NodeJS.Timeout | number | null = null;

  constructor() {
    this.loop = this.loop.bind(this);
  }

  start(): void {
    if (this.isStarted)
      return;
    this.isStarted = true;
    this.lastTime = performance.now();
    this.startTime = this.lastTime + IntervalTimer.INTERVAL / 2;
    this.intervalId = setInterval(this.loop, IntervalTimer.INTERVAL);
  }

  stop(): void {
    this.isStarted = false;
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
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

  setAudioRefreshCallback(fun: (soundLength: number) => void): void {
    this.audioRefreshCallback = fun;
  }

  setTicksPerFrame(ticks: number): void {
    this.lastTime = performance.now();
    this.startTime = this.lastTime + IntervalTimer.INTERVAL / 2;
    this.ticksPerFrame = ticks;
  }

  private loop(): void {
    if (!this.isStarted) return;

    this.lastTime = performance.now();

    for (let frames = 0; (IntervalTimer.INTERVAL < this.lastTime - this.startTime) && frames < 2; this.startTime += IntervalTimer.INTERVAL, frames++) {
      for (let i = 0; i < this.ticksPerFrame; i++) {
        this.tickCallback();
      }
      this.timerCallback();
      this.audioRefreshCallback(IntervalTimer.INTERVAL / 1000);
    }
    this.drawCallback();

    setTimeout(this.loop, IntervalTimer.INTERVAL);
  }
}
