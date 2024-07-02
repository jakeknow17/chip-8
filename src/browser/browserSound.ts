import { Sound } from "../interfaces/sound";

export class BrowserSound implements Sound {
  private frequency: number;
  private started: boolean = false;

  private audioContext: AudioContext;
  private gainNode: GainNode;
  private oscillator: OscillatorNode | null;

  constructor(frequency = 440, volume = 0.25) {
    this.frequency = frequency;
    // Clamp volume between 0.0 and 1.0
    volume = Math.min(Math.max(volume, 0.0), 1.0);

    this.audioContext = new AudioContext();

    this.gainNode = this.audioContext.createGain();
    this.gainNode.connect(this.audioContext.destination)
    this.gainNode.gain.value = volume;

    this.oscillator = null;
  }

  start(): void {
    if (this.started)
      return;
    this.oscillator = this.audioContext.createOscillator();
    this.oscillator.connect(this.gainNode);
    this.oscillator.type = "square";
    this.oscillator.frequency.value = this.frequency;
    this.oscillator.start();
    this.started = true;
  }

  stop(): void {
    if (!this.started)
      return;
    this.oscillator?.stop();
    this.started = false;
  }

  isPlaying(): boolean {
    return this.started;
  }

  setFrequency(frequency: number): void {
    this.frequency = frequency;
  }

  setVolume(volume: number): void {
    // Clamp volume between 0.0 and 1.0
    volume = Math.min(Math.max(volume, 0.0), 1.0);

    this.gainNode.gain.value = volume;
  }
}
