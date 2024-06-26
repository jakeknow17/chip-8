import { Display } from "./interfaces/display.js"
import { Timer } from "./interfaces/timer.js";
import { Keyboard } from "./interfaces/keyboard.js";
import { Sound } from "./interfaces/sound.js";

export class Emulator {
  static readonly MEM_SIZE = 4096;
  static readonly STACK_SIZE = 16;
  static readonly NUM_REGS = 16;
  static readonly PROG_START_ADDR = 0x200;

  private display: Display;
  private timer: Timer;
  private keyboard: Keyboard;
  private sound: Sound;

  private memory = new Uint8Array(Emulator.MEM_SIZE);
  private stack = new Uint16Array(Emulator.STACK_SIZE);
  private rom: Uint8Array | undefined;

  private pc = Emulator.PROG_START_ADDR;
  private sp = Emulator.STACK_SIZE;
  private registers = new Uint8Array(Emulator.NUM_REGS);
  private registerI = 0;

  private dt = 0;
  private st = 0;

  private waiting = false;

  constructor(display: Display, cycleTimer: Timer, keyboard: Keyboard, sound: Sound) {
    this.display = display;
    this.timer = cycleTimer;
    this.keyboard = keyboard;
    this.sound = sound;
    cycleTimer.setCallback(this.emulateCycle.bind(this));
    this.initialize();
  }

  load(rom: Uint8Array) {
    this.rom = new Uint8Array(rom);
  }

  private initialize() {
    this.memory.fill(0);
    this.pc = Emulator.PROG_START_ADDR;
    this.sp = 0;
    this.registers.fill(0);
    this.registerI = 0;
  }

  private initializeChars() {
    const chars = new Uint8Array([
      // Character 0
      0xF0, 0x90, 0x90, 0x90, 0xF0,
      // Character 1
      0x20, 0x60, 0x20, 0x20, 0x70,
      // Character 2
      0xF0, 0x10, 0xF0, 0x80, 0xF0,
      // Character 3
      0xF0, 0x10, 0xF0, 0x10, 0xF0,
      // Character 4
      0x90, 0x90, 0xF0, 0x10, 0x10,
      // Character 5
      0xF0, 0x80, 0xF0, 0x10, 0xF0,
      // Character 6
      0xF0, 0x80, 0xF0, 0x90, 0xF0,
      // Character 7
      0xF0, 0x10, 0x20, 0x40, 0x40,
      // Character 8
      0xF0, 0x90, 0xF0, 0x90, 0xF0,
      // Character 9
      0xF0, 0x90, 0xF0, 0x10, 0xF0,
      // Character A
      0xF0, 0x90, 0xF0, 0x90, 0x90,
      // Character B
      0xE0, 0x90, 0xE0, 0x90, 0xE0,
      // Character C
      0xF0, 0x80, 0x80, 0x80, 0xF0,
      // Character D
      0xE0, 0x90, 0x90, 0x90, 0xE0,
      // Character E
      0xF0, 0x80, 0xF0, 0x80, 0xF0,
      // Character F
      0xF0, 0x80, 0xF0, 0x80, 0x80
    ]);

    // Place these at the beginning of memory
    this.memory.set(chars);
  }

  private updateTimers() {
    if (this.dt > 0) {
      this.dt--;
    }

    if (this.st > 0) {
      if (!this.sound.isPlaying())
        this.sound.start();
      this.st--;
    }
    else {
      if (this.sound.isPlaying())
        this.sound.stop();
    }
  }

  emulateCycle() {
    this.updateTimers()

    if (this.waiting)
      return;

    const instByte0: number = this.memory[this.pc];
    const instByte1: number = this.memory[this.pc + 1];

    const instNibble0: number = instByte0 >>> 4;
    const instNibble1: number = instByte0 & 0xf;
    const instNibble2: number = instByte1 >>> 4;
    const instNibble3: number = instByte1 & 0xf;

    const inst = (instByte0 << 8) | instByte1;

    // -------Instruction Layout-------
    // A Chip-8 instruction is 2 bytes.
    //
    //        xxxx xxxx xxxx xxxx
    //        -n0- -n1- -n2- -n3-
    //        --byte0-- --byte1--
    //        ----instruction----
    //

    switch (instNibble0) {
      case 0x0:
        // 00Cn - SCD nibble
        if (instNibble2 === 0xc)
          this.display.scrollDown(instNibble3);
        // 00E0 - CLS
        else if (instByte1 === 0xe0)
          this.display.clear();
        // 00EE - RET
        else if (instByte1 === 0xee) {
          this.pc = this.stack[--this.sp];
          return;
        }
        // 00FB - SCR
        else if (instByte1 === 0xfb)
          this.display.scrollRight(4);
        // 00FC - SCL
        else if (instByte1 === 0xfc)
          this.display.scrollLeft(4);
        // 00FD - EXIT
        // 00FE - LOW
        else if (instByte1 === 0xfe)
          this.display.setExtended(false);
        // 00FF - HIGH
        else if (instByte1 === 0xff)
          this.display.setExtended(true);
        break;
      case 0x1:
        // 1nnn - JP addr
        this.pc = inst & 0xfff;
        return;
      case 0x2:
        // 2nnn - CALL addr
        this.stack[this.sp++] = this.pc + 2;
        this.pc = inst & 0xfff;
        return;
      case 0x3:
        // 3xkk - SE Vx, byte
        if (this.registers[instNibble1] === instByte1)
          this.pc += 2;
        break;
      case 0x4:
        // 4xkk - SNE Vx, byte
        if (this.registers[instNibble1] !== instByte1)
          this.pc += 2;
        break;
      case 0x5:
        // 5xy0 - SE Vx, Vy
        if (this.registers[instNibble1] === this.registers[instNibble2])
          this.pc += 2;
        break;
      case 0x6:
        // 6xkk - LD Vx, byte
        this.registers[instNibble1] = instByte1;
        break;
      case 0x7:
        // 7xkk - ADD Vx, byte
        this.registers[instNibble1] += instByte1;
        break;
      case 0x8:
        // 8xy0 - LD Vx, Vy
        if ((instNibble3) === 0x0) {
          this.registers[instNibble1] = this.registers[instNibble2];
        }
        // 8xy1 - OR Vx, Vy
        else if ((instNibble3) === 0x1) {
          this.registers[instNibble1] |= this.registers[instNibble2];
        }
        // 8xy2 - AND Vx, Vy
        else if ((instNibble3) === 0x2) {
          this.registers[instNibble1] &= this.registers[instNibble2];
        }
        // 8xy3 - XOR Vx, Vy
        else if ((instNibble3) === 0x3) {
          this.registers[instNibble1] ^= this.registers[instNibble2];
        }
        // 8xy4 - ADD Vx, Vy
        else if ((instNibble3) === 0x4) {
          const sum = this.registers[instNibble1] + this.registers[instNibble2];
          this.registers[instNibble1] = sum; // Automatically truncates value to 8 bits
          this.registers[0xf] = sum > 0xff ? 1 : 0; // Overflow
        }
        // 8xy5 - SUB Vx, Vy
        else if ((instNibble3) === 0x5) {
          const diff = this.registers[instNibble1] - this.registers[instNibble2];
          this.registers[instNibble1] = diff; // Automatically truncates value to 8 bits
          this.registers[0xf] = diff < 0 ? 0 : 1; // Overflow
        }
        // 8xy6 - SHR Vx {, Vy}
        else if ((instNibble3) === 0x6) {
          const flag = (this.registers[instNibble2] & 0x1) ? 1 : 0;
          this.registers[instNibble1] = this.registers[instNibble2] >>> 1;
          this.registers[0xf] = flag;
        }
        // 8xy7 - SUBN Vx, Vy
        else if ((instNibble3) === 0x7) {
          const diff = this.registers[instNibble2] - this.registers[instNibble1];
          this.registers[instNibble1] = diff; // Automatically truncates value to 8 bits
          this.registers[0xf] = diff < 0 ? 0 : 1; // Overflow
        }
        // 8xyE - SHL Vx, Vy
        else if ((instNibble3) === 0xe) {
          const flag = (this.registers[instNibble2] & 0x80) ? 1 : 0;
          this.registers[instNibble1] = this.registers[instNibble2] << 1;
          this.registers[0xf] = flag;
        }
        break
      case 0x9:
        // 9xy0 - SNE Vx, Vy
        // TODO: Possibly check if the last nibble is 0
        if (this.registers[instNibble1] !== this.registers[instNibble2])
          this.pc += 2;
        break;
      case 0xa:
        const addr = inst & 0xfff;
        this.registerI = addr;
        break
      case 0xb:
        this.pc = (inst & 0xfff) + this.registers[0x0];
        return;
      case 0xc:
        // Cxkk - RND Vx, byte
        // TODO: Change this to a prng that can be seeded
        const randByte = Math.floor(Math.random() * 256);
        this.registers[instNibble1] = randByte & instByte1;
        break;
      case 0xd:
        const sprite = this.memory.slice(this.registerI, this.registerI + instNibble3);
        if (this.display.drawSprite(sprite, this.registers[instNibble1], this.registers[instNibble2]))
          this.registers[0xf] = 1;
        else
          this.registers[0xf] = 0;
        break
      case 0xe:
        // Ex9E - SKP Vx
        if (instByte1 === 0x9e) {
          if (this.keyboard.isPressed(this.registers[instNibble1]))
            this.pc += 2;
        }
        // ExA1 - SKNP Vx
        else if (instByte1 === 0xa1) {
          if (!this.keyboard.isPressed(this.registers[instNibble1]))
            this.pc += 2;
        }
        break;
      case 0xf:
        // Fx07 - LD Vx, DT
        if (instByte1 === 0x07) {
          this.registers[instNibble1] = this.dt;
        }
        // Fx0A - LD Vx, K
        else if (instByte1 === 0x0a) {
          this.waiting = true;
          const waitKey = this.keyboard.waitKey();
          waitKey.then(value => {
            this.registers[instNibble1] = value;
            this.waiting = false;
          })
        }
        // Fx15 - LD DT, Vx
        else if (instByte1 === 0x15) {
          this.dt = this.registers[instNibble1];
        }
        // Fx18 - LD ST, Vx
        else if (instByte1 === 0x18) {
          this.st = this.registers[instNibble1];
        }
        // Fx1E - ADD I, Vx
        else if (instByte1 === 0x1e) {
          this.registerI = (this.registerI + this.registers[instNibble1]) & 0xffff;
        }
        // Fx29 - LD F, Vx
        else if (instByte1 === 0x29) {
          this.registerI = this.registers[instNibble1] * 5; // Each character sprite is 5 bytes long
        }
        // Fx33 - LD B, Vx
        else if (instByte1 === 0x33) {
          this.memory[this.registerI] = Math.floor(this.registers[instNibble1] / 100); // Hundreds digit
          // TODO: Check if wrap around in case of reaching max memory addr
          this.memory[this.registerI + 1] = Math.floor((this.registers[instNibble1] % 100) / 10); // Tens digit
          this.memory[this.registerI + 2] = Math.floor(this.registers[instNibble1] % 10); // Ones digit
        }
        // Fx55 - LD [I], Vx
        else if (instByte1 === 0x55) {
          // TODO: Check if wrap around in case of reaching max memory addr
          for (let i = 0; i <= instNibble1; i++) {
            this.memory[this.registerI + i] = this.registers[i];
          }
        }
        // Fx65 - LD Vx, [I]
        else if (instByte1 === 0x65) {
          // TODO: Check if wrap around in case of reaching max memory addr
          for (let i = 0; i <= instNibble1; i++) {
            this.registers[i] = this.memory[this.registerI + i];
          }
        }
        else {
          throw new Error("Unsupported instruction! 0x" + inst.toString(16));
        }
        break;
    }

    this.pc += 2;
  }

  setEmulationSpeed(ticksPerSecond: number) {
    this.timer.setTicksPerSecond(ticksPerSecond);
  }

  setSoundFrequency(freqHz: number) {
    this.sound.setFrequency(freqHz);
  }

  setSoundVolume(volume: number) {
    this.sound.setVolume(volume);
  }

  reset() {
    this.timer.stop();
    this.initialize();
    this.initializeChars();
    this.display.clear();
    if (this.rom)
      this.memory.set(this.rom, Emulator.PROG_START_ADDR);
  }

  start() {
    if (!this.rom) {
      console.log("No ROM loaded");
      return;
    }

    this.reset();

    this.timer.start();
  }

  pause() {
    this.timer.stop();
  }

  continue() {
    this.timer.start();
  }
}
