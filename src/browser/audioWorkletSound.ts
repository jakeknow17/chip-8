import { Sound } from "../interfaces/sound";

const processorCode = `
  class SampleBufferProcessor extends AudioWorkletProcessor {
    constructor() {
      super();
      this.audioData = [];
      this.port.onmessage = this.handleMessage.bind(this);
      this.pointer = 0;
    }

    handleMessage(event) {
      if (event.data.command === 'enqueue') {
        this.audioData.push(event.data.audioBuffer);
      } else if (event.data.command === 'reset') {
        this.audioData = [];
      }
    }

    process(inputs, outputs, parameters) {
      const output = outputs[0];
      const outData = output[0];
      let index = 0;
      while (this.audioData.length && index < outData.length) {
        const audioBuffer = this.audioData[0];
        const size = Math.min(outData.length - index, audioBuffer.length - this.pointer);
        for (let i = 0; i < size; i++) {
          outData[index++] = audioBuffer[this.pointer++];
        }
        if (this.pointer >= audioBuffer.length) {
          this.audioData.shift();
          this.pointer = 0;
        }
      }
      while (index < outData.length) {
        outData[index++] = 0;
      }
      return true;
    }
  }

  registerProcessor('sample-buffer-processor', SampleBufferProcessor);
`;

const dataURL = `data:application/javascript;base64,${btoa(processorCode)}`;

class SampleBuffer {
  pointer = 0;
  buffer: Float32Array;
  duration: number;

  constructor(buffer: Float32Array, duration: number) {
    this.buffer = buffer;
    this.duration = duration;
  }
}

export class AudioWorkletSound implements Sound {
  static readonly BASE_FREQUENCY = 4000;
  static readonly PITCH_BIAS = 64;

  private audioContext: AudioContext;
  private audioNode: AudioWorkletNode | undefined;
  private gainNode: GainNode;
  private audioData: SampleBuffer[] = [];

  private readonly silentPattern = new Uint8Array(64).fill(0);

  static readonly ALPHA_CUTOFF_FREQUENCY = 18000;
  static readonly LOW_PASS_FILTER_STEPS = 4;
  private lowPassBuffer = new Array<number>(AudioWorkletSound.LOW_PASS_FILTER_STEPS + 1).fill(0);

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

    this.pitch = AudioWorkletSound.PITCH_BIAS;
    this.state = { pos: 0 };
    this.buffer = new Uint8Array();
    this.timer = 0;
    this.resetFlag = false;

    this.audioContext = new AudioContext();
    this.gainNode = this.audioContext.createGain();
    this.gainNode.gain.value = volume;

    this.initAudioWorklet().then(() => {
      this.reset();
      window.addEventListener("click", this.enable.bind(this));
    });
  }

  private async initAudioWorklet() {
    await this.audioContext.audioWorklet.addModule(dataURL);
    this.audioNode = new AudioWorkletNode(this.audioContext, 'sample-buffer-processor');
    this.audioNode.port.onmessage = this.handleWorkletMessage.bind(this);
    this.audioNode.connect(this.gainNode);
    this.gainNode.connect(this.audioContext.destination);
  }

  private handleWorkletMessage(event: MessageEvent) {
    // Handle messages from AudioWorkletProcessor if needed
    console.log("Worklet:", event);
  }

  reset() {
    this.enableXO = false;
    this.pitch = AudioWorkletSound.PITCH_BIAS;
    this.state = { pos: 0 };
    this.buffer = new Uint8Array();
    this.timer = 0;
    this.resetFlag = false;
    this.audioData = [];
    if (this.audioNode) {
      this.audioNode.port.postMessage({ command: 'reset' });
    }
  }

  private playPattern(soundLength: number, buffer: Uint8Array, pitch = AudioWorkletSound.PITCH_BIAS, sampleState = { pos: 0 }) {
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
    if (this.audioNode) {
      this.audioNode.port.postMessage({ command: 'enqueue', audioBuffer });
    }
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
    const c = Math.cos(2 * Math.PI * AudioWorkletSound.ALPHA_CUTOFF_FREQUENCY / samplingFrequency);
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
    if (this.audioNode) {
      this.audioNode.disconnect();
    }
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
    return AudioWorkletSound.BASE_FREQUENCY * 2 ** ((pitch - AudioWorkletSound.PITCH_BIAS) / 48);
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
