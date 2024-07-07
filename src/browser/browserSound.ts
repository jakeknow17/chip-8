import { Sound } from "../interfaces/sound";

class SampleBuffer {
  private pointer = 0;
  private buffer: Float32Array;
  private duration: number;

  constructor(buffer: Float32Array, duration: number) {
    this.buffer = buffer;
    this.duration = duration;
  }

  write(buffer: Float32Array, index: number, size: number) {
    size = Math.min(Math.max(size, 0), this.duration);
    if (!size) return size;

    this.duration -= size;
    const end = index + size;

    for (let i = index; i < end; i++) {
      buffer[i] = this.buffer[this.pointer++];
      this.pointer %= this.buffer.length;
    }

    return size;
  }

  dequeue(duration: number) {
    this.duration -= duration;
  }

  getDuration(): number {
    return this.duration;
  }
}

export class BrowserSound implements Sound {
  static readonly BASE_FREQUENCY = 4000;
  static readonly PITCH_BIAS = 64;

  private audioContext: AudioContext;
  private audioNode: ScriptProcessorNode;
  private gainNode: GainNode;
  private audioData: SampleBuffer[] = [];

  private readonly silentPattern = new Uint8Array(64).fill(0);

  static readonly ALPHA_CUTOFF_FREQUENCY = 18000;
  static readonly LOW_PASS_FILTER_STEPS = 4;
  private lowPassBuffer = new Array<number>(BrowserSound.LOW_PASS_FILTER_STEPS + 1).fill(0);

  private pitch: number;
  private state: { pos: number }
  private buffer: Uint8Array;
  private timer: number;
  private resetFlag: boolean;

  private enableXO = false;

  private oscillator: OscillatorNode | null;

  constructor(volume = 0.01) {
    // Clamp volume between 0.0 and 1.0
    volume = Math.min(Math.max(volume, 0.0), 1.0);

    this.oscillator = null;

    this.pitch = BrowserSound.PITCH_BIAS;
    this.state = { pos: 0 };
    this.buffer = new Uint8Array();
    this.timer = 0;
    this.resetFlag = false;

    this.audioContext = new AudioContext();
    const bufferSize =
      this.audioContext.sampleRate < 64000 ? 2048 :
        this.audioContext.sampleRate < 128000 ? 4096 : 8192;
    this.audioNode = this.audioContext.createScriptProcessor(bufferSize, 1, 1);
    this.gainNode = this.audioContext.createGain();
    this.gainNode.gain.value = volume;
    this.audioNode.onaudioprocess = this.process.bind(this);

    this.reset();

    // TODO: Adjust event listener to be more robust
    window.addEventListener("click", this.enable.bind(this));
  }

  reset() {
    this.enableXO = false;
    this.pitch = BrowserSound.PITCH_BIAS;
    this.state = { pos: 0 };
    this.buffer = new Uint8Array();
    this.timer = 0;
    this.resetFlag = false;
    this.audioData = [];
    this.audioNode.connect(this.gainNode);
    this.gainNode.connect(this.audioContext.destination)
  }

  private process(audioProcessingEvent: AudioProcessingEvent) {
    const out = audioProcessingEvent.outputBuffer;
    const outData = out.getChannelData(0);
    let index = 0;
    while (this.audioData.length && index < out.length) {
      const size = out.length - index;
      const written = this.audioData[0].write(outData, index, size);
      index += written;
      if (written < size)
        this.audioData.shift();
    }
    while (index < out.length)
      outData[index++] = 0;
    if (this.audioData.length > 1) {
      let audioDataSize = 0;
      this.audioData.forEach(buffer => audioDataSize += buffer.getDuration());
      while (audioDataSize > this.audioNode.bufferSize && this.audioData.length > 1)
        audioDataSize -= this.audioData.shift()!.getDuration();
    }
  }

  private playPattern(soundLength: number, buffer: Uint8Array, pitch = BrowserSound.PITCH_BIAS, sampleState = { pos: 0 }) {
    this.enable();

    const frequency = this.frequencyFromPitch(pitch);
    const samples = Math.ceil(this.audioContext.sampleRate * soundLength);

    const audioBuffer = new Float32Array(samples);

    const step = frequency / this.audioContext.sampleRate;
    let pos = sampleState.pos;

    const quality = Math.ceil(384000 / this.audioContext.sampleRate);
    const lowPassAlpha = this.getLowPassAlpha(this.audioContext.sampleRate * quality);

    for (let i = 0; i < samples; i++) {
      let value = 0;
      for (let j = 0; j < quality; j++) {
        const cell = pos >> 3;
        const shift = pos & 7 ^ 7;
        value = this.getLowPassFilteredValue(lowPassAlpha, buffer[cell] >> shift & 0x1);
        pos = (pos + step / quality) % (buffer.length * 8);
      }
      audioBuffer[i] = value;
    }
    this.audioData.push(new SampleBuffer(audioBuffer, samples));
    return { pos };
  }

  private playTone() {
    if (this.oscillator)
      return;
    this.oscillator = this.audioContext.createOscillator();
    this.oscillator.connect(this.gainNode);
    this.oscillator.type = "square";
    this.oscillator.frequency.value = this.frequencyFromPitch(this.pitch) / 4;
    this.oscillator.start();
  }

  private getLowPassAlpha(samplingFrequency: number): number {
    const c = Math.cos(2 * Math.PI * BrowserSound.ALPHA_CUTOFF_FREQUENCY / samplingFrequency);
    return c - 1 + Math.sqrt(c * c - 4 * c + 3);
  }

  private getLowPassFilteredValue(alpha: number, target: number): number {
    this.lowPassBuffer[0] = target;
    for (let i = 1; i < this.lowPassBuffer.length; i++)
      this.lowPassBuffer[i] += (this.lowPassBuffer[i - 1] - this.lowPassBuffer[i]) * alpha;
    return this.lowPassBuffer[this.lowPassBuffer.length - 1];
  }

  enable(): void {
    if (this.audioContext.state === "suspended") {
      this.audioContext.resume();
      console.log("Audio resumed");
    }
  }

  stop(): void {
    this.audioNode.disconnect();
    this.audioData = [];
    if (this.oscillator) {
      this.oscillator.stop();
      this.oscillator = null;
    }
  }

  refresh(soundLength: number): void {
    if (this.resetFlag) {
      this.state.pos = 0;
      this.resetFlag = false;
    }
    if (this.timer === 0) {
      if (this.enableXO)
        this.playPattern(soundLength, this.silentPattern);
      else {
        if (this.oscillator) {
          this.oscillator.stop();
          this.oscillator = null;
        }
      }
    }
    else {
      if (this.enableXO)
        this.state = this.playPattern(soundLength, this.buffer, this.pitch, this.state);
      else
        this.playTone();
    }
    if ((this.timer -= (this.timer > 0) ? 1 : 0) === 0)
      this.resetFlag = true;
    while (this.audioData.length > 8)
      this.audioData.shift();
  }

  setTimer(timer: number): void {
    if (timer === 0)
      this.resetFlag = true;
    this.timer = timer;
  }

  setBuffer(buffer: Uint8Array): void {
    this.enableXO = true;
    this.buffer = buffer;
  }

  private frequencyFromPitch(pitch: number): number {
    return BrowserSound.BASE_FREQUENCY * 2 ** ((pitch - BrowserSound.PITCH_BIAS) / 48)
  }

  setPitch(pitch: number): void {
    this.enableXO = true;
    this.pitch = pitch;
  }

  setVolume(volume: number): void {
    // Clamp volume between 0.0 and 1.0
    volume = Math.min(Math.max(volume, 0.0), 1.0);

    this.gainNode.gain.value = volume;
  }
}
