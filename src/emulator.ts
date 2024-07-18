import { Display } from "./interfaces/display.js"
import { Timer } from "./interfaces/timer.js";
import { Keyboard } from "./interfaces/keyboard.js";
import { Sound } from "./interfaces/sound.js";
import { Logger, LogLevel } from "./abstract/logger.js";

export class Emulator {
  static readonly MEM_SIZE = 0x10000;
  static readonly STACK_SIZE = 16;
  static readonly NUM_REGS = 16;
  static readonly PROG_START_ADDR = 0x200;

  private quirks = {
    shift: false,
    loadStore: false,
    vfOrder: false,
    clip: false,
    jump: false,
    logic: false,
    vBlank: false
  }

  private smallChars = new Uint8Array([
    0xF0, 0x90, 0x90, 0x90, 0xF0, // 0
    0x20, 0x60, 0x20, 0x20, 0x70, // 1
    0xF0, 0x10, 0xF0, 0x80, 0xF0, // 2
    0xF0, 0x10, 0xF0, 0x10, 0xF0, // 3
    0x90, 0x90, 0xF0, 0x10, 0x10, // 4
    0xF0, 0x80, 0xF0, 0x10, 0xF0, // 5
    0xF0, 0x80, 0xF0, 0x90, 0xF0, // 6
    0xF0, 0x10, 0x20, 0x40, 0x40, // 7
    0xF0, 0x90, 0xF0, 0x90, 0xF0, // 8
    0xF0, 0x90, 0xF0, 0x10, 0xF0, // 9
    0xF0, 0x90, 0xF0, 0x90, 0x90, // A
    0xE0, 0x90, 0xE0, 0x90, 0xE0, // B
    0xF0, 0x80, 0x80, 0x80, 0xF0, // C
    0xE0, 0x90, 0x90, 0x90, 0xE0, // D
    0xF0, 0x80, 0xF0, 0x80, 0xF0, // E
    0xF0, 0x80, 0xF0, 0x80, 0x80  // F
  ]);
  private bigChars = new Uint8Array([
    0xFF, 0xFF, 0xC3, 0xC3, 0xC3, 0xC3, 0xC3, 0xC3, 0xFF, 0xFF, // 0
    0x18, 0x78, 0x78, 0x18, 0x18, 0x18, 0x18, 0x18, 0xFF, 0xFF, // 1
    0xFF, 0xFF, 0x03, 0x03, 0xFF, 0xFF, 0xC0, 0xC0, 0xFF, 0xFF, // 2
    0xFF, 0xFF, 0x03, 0x03, 0xFF, 0xFF, 0x03, 0x03, 0xFF, 0xFF, // 3
    0xC3, 0xC3, 0xC3, 0xC3, 0xFF, 0xFF, 0x03, 0x03, 0x03, 0x03, // 4
    0xFF, 0xFF, 0xC0, 0xC0, 0xFF, 0xFF, 0x03, 0x03, 0xFF, 0xFF, // 5
    0xFF, 0xFF, 0xC0, 0xC0, 0xFF, 0xFF, 0xC3, 0xC3, 0xFF, 0xFF, // 6
    0xFF, 0xFF, 0x03, 0x03, 0x06, 0x0C, 0x18, 0x18, 0x18, 0x18, // 7
    0xFF, 0xFF, 0xC3, 0xC3, 0xFF, 0xFF, 0xC3, 0xC3, 0xFF, 0xFF, // 8
    0xFF, 0xFF, 0xC3, 0xC3, 0xFF, 0xFF, 0x03, 0x03, 0xFF, 0xFF, // 9
    0x7E, 0xFF, 0xC3, 0xC3, 0xC3, 0xFF, 0xFF, 0xC3, 0xC3, 0xC3, // A
    0xFC, 0xFC, 0xC3, 0xC3, 0xFC, 0xFC, 0xC3, 0xC3, 0xFC, 0xFC, // B
    0x3C, 0xFF, 0xC3, 0xC0, 0xC0, 0xC0, 0xC0, 0xC3, 0xFF, 0x3C, // C
    0xFC, 0xFE, 0xC3, 0xC3, 0xC3, 0xC3, 0xC3, 0xC3, 0xFE, 0xFC, // D
    0xFF, 0xFF, 0xC0, 0xC0, 0xFF, 0xFF, 0xC0, 0xC0, 0xFF, 0xFF, // E
    0xFF, 0xFF, 0xC0, 0xC0, 0xFF, 0xFF, 0xC0, 0xC0, 0xC0, 0xC0  // F
  ]);

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
  private pattern = new Uint8Array(16);
  private flagRegisters = new Uint8Array(Emulator.NUM_REGS);
  private registerI = 0;

  private dt = 0;
  private st = 0;

  private waiting = false;
  private waitingReg = -1;
  private halted = false;

  private logger;

  constructor(display: Display, cycleTimer: Timer, keyboard: Keyboard, sound: Sound, logger: Logger) {
    this.display = display;
    this.timer = cycleTimer;
    this.keyboard = keyboard;
    this.sound = sound;
    this.logger = logger;
    cycleTimer.setTickCallback(this.emulateCycle.bind(this));
    cycleTimer.setDrawCallback(this.display.drawScreen.bind(this.display));
    cycleTimer.setTimerCallback(this.updateTimers.bind(this));
    cycleTimer.setAudioRefreshCallback(this.sound.refresh.bind(this.sound));
    this.initialize();
  }

  setLogLevel(level: LogLevel) {
    this.logger.setLevel(level);
  }

  load(rom: Uint8Array) {
    this.rom = new Uint8Array(rom);
    this.memory.set(this.rom, Emulator.PROG_START_ADDR);
    this.logger.info("Rom loaded");
  }

  private halt() {
    this.halted = true;
    this.pause();
  }

  private initialize() {
    this.memory.fill(0);
    this.stack.fill(0);
    this.pc = Emulator.PROG_START_ADDR;
    this.sp = 0;
    this.registers.fill(0);
    this.flagRegisters.fill(0);
    this.registerI = 0;
  }

  private initializeChars() {

    // Place these at the beginning of memory
    this.memory.set(this.smallChars);
    this.memory.set(this.bigChars, this.smallChars.length);
  }

  private updateTimers() {
    this.dt -= (this.dt > 0 ? 1 : 0)
    this.st -= (this.st > 0 ? 1 : 0)
  }

  emulateCycle() {
    if (this.halted)
      return;

    if (this.waiting) {
      if (this.keyboard.getWaitKey() !== null) {
        this.registers[this.waitingReg] = this.keyboard.getWaitKey() as number;
        this.keyboard.clearWaitKey();
        this.waitingReg = -1;
        this.waiting = false;
      }
      else return;
    }

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
        if (inst === 0x0000)
          this.halt();
        // 00Cn - SCD nibble
        else if (instNibble2 === 0xc)
          this.display.scrollDown(instNibble3);
        // 00Dn - SCU nibble
        else if (instNibble2 === 0xd)
          this.display.scrollUp(instNibble3);
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
        else if (instByte1 === 0xfd)
          this.halt();
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
        if (this.registers[instNibble1] === instByte1) {
          const nextInstr = (this.memory[this.pc + 2] << 8) | this.memory[this.pc + 3];
          if (nextInstr === 0xf000)
            this.pc += 4;
          else
            this.pc += 2;
        }
        break;
      case 0x4:
        // 4xkk - SNE Vx, byte
        if (this.registers[instNibble1] !== instByte1) {
          const nextInstr = (this.memory[this.pc + 2] << 8) | this.memory[this.pc + 3];
          if (nextInstr === 0xf000)
            this.pc += 4;
          else
            this.pc += 2;
        }
        break;
      case 0x5:
        // 5xy0 - SE Vx, Vy
        if (instNibble3 === 0 && this.registers[instNibble1] === this.registers[instNibble2]) {
          const nextInstr = (this.memory[this.pc + 2] << 8) | this.memory[this.pc + 3];
          if (nextInstr === 0xf000)
            this.pc += 4;
          else
            this.pc += 2;
        }
        // XO-Chip save
        else if (instNibble3 === 2) {
          for (let i = instNibble1; i <= instNibble2; i++)
            this.memory[this.registerI + i - instNibble1] = this.registers[i];
        }
        // XO-Chip load
        else if (instNibble3 === 3) {
          for (let i = instNibble1; i <= instNibble2; i++)
            this.registers[i] = this.memory[this.registerI + i - instNibble1];
        }
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
          if (this.quirks.logic)
            this.registers[0xf] = 0;
        }
        // 8xy2 - AND Vx, Vy
        else if ((instNibble3) === 0x2) {
          this.registers[instNibble1] &= this.registers[instNibble2];
          if (this.quirks.logic)
            this.registers[0xf] = 0;
        }
        // 8xy3 - XOR Vx, Vy
        else if ((instNibble3) === 0x3) {
          this.registers[instNibble1] ^= this.registers[instNibble2];
          if (this.quirks.logic)
            this.registers[0xf] = 0;
        }
        // 8xy4 - ADD Vx, Vy
        else if ((instNibble3) === 0x4) {
          const sum = this.registers[instNibble1] + this.registers[instNibble2];
          this.registers[instNibble1] = sum; // Automatically truncates value to 8 bits
          this.registers[0xf] = sum > 0xff ? 1 : 0; // Overflow
          if (this.quirks.vfOrder)
            this.registers[instNibble1] = sum;
        }
        // 8xy5 - SUB Vx, Vy
        else if ((instNibble3) === 0x5) {
          const diff = this.registers[instNibble1] - this.registers[instNibble2];
          this.registers[instNibble1] = diff; // Automatically truncates value to 8 bits
          this.registers[0xf] = diff < 0 ? 0 : 1; // Overflow
          if (this.quirks.vfOrder)
            this.registers[instNibble1] = diff;
        }
        // 8xy6 - SHR Vx {, Vy}
        else if ((instNibble3) === 0x6) {
          let flag, val;
          if (this.quirks.shift) {
            flag = (this.registers[instNibble1] & 0x1) ? 1 : 0;
            val = this.registers[instNibble1] >>> 1;
          }
          else {
            flag = (this.registers[instNibble2] & 0x1) ? 1 : 0;
            val = this.registers[instNibble2] >>> 1;
          }
          this.registers[instNibble1] = val;
          this.registers[0xf] = flag;
          if (this.quirks.vfOrder)
            this.registers[instNibble1] = val;
        }
        // 8xy7 - SUBN Vx, Vy
        else if ((instNibble3) === 0x7) {
          const diff = this.registers[instNibble2] - this.registers[instNibble1];
          this.registers[instNibble1] = diff; // Automatically truncates value to 8 bits
          this.registers[0xf] = diff < 0 ? 0 : 1; // Overflow
          if (this.quirks.vfOrder)
            this.registers[instNibble1] = diff;
        }
        // 8xyE - SHL Vx, Vy
        else if ((instNibble3) === 0xe) {
          let flag, val;
          if (this.quirks.shift) {
            flag = (this.registers[instNibble1] & 0x80) ? 1 : 0;
            val = this.registers[instNibble1] << 1;
          }
          else {
            flag = (this.registers[instNibble2] & 0x80) ? 1 : 0;
            val = this.registers[instNibble2] << 1;
          }
          this.registers[instNibble1] = val;
          this.registers[0xf] = flag;
          if (this.quirks.vfOrder)
            this.registers[instNibble1] = val;
        }
        break
      case 0x9:
        // 9xy0 - SNE Vx, Vy
        // TODO: Possibly check if the last nibble is 0
        if (this.registers[instNibble1] !== this.registers[instNibble2]) {
          const nextInstr = (this.memory[this.pc + 2] << 8) | this.memory[this.pc + 3];
          if (nextInstr === 0xf000)
            this.pc += 4;
          else
            this.pc += 2;
        }
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
        let sprite: Uint8Array;
        let isWide: boolean;
        if (instNibble3 !== 0) {
          sprite = this.memory.slice(this.registerI, this.registerI + instNibble3);
          isWide = false;
        }
        else {
          sprite = this.memory.slice(this.registerI, this.registerI + 32);
          isWide = true;
        }
        if (this.display.drawSprite(sprite, this.registers[instNibble1], this.registers[instNibble2], isWide))
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
        // XO-Chip long addr
        if ((inst & 0xfff) === 0x000) {
          const addr = (this.memory[this.pc + 2] << 8) | this.memory[this.pc + 3];
          this.registerI = addr;
          this.pc += 2;
        }
        // XO-Chip plane
        else if (instByte1 === 0x01) {
          this.display.setPlaneBitmask(instNibble1 & 0x3);
        }
        // XO-Chip audio
        else if ((inst & 0xfff) === 0x002) {
          for (let i = 0; i < 16; i++)
            this.pattern[i] = this.memory[this.registerI + i];
          this.sound.setBuffer(this.pattern);
        }
        // Fx07 - LD Vx, DT
        else if (instByte1 === 0x07) {
          this.registers[instNibble1] = this.dt;
        }
        // Fx0A - LD Vx, K
        else if (instByte1 === 0x0a) {
          this.waiting = true;
          this.waitingReg = instNibble1;
          this.keyboard.startWait();
        }
        // Fx15 - LD DT, Vx
        else if (instByte1 === 0x15) {
          this.dt = this.registers[instNibble1];
        }
        // Fx18 - LD ST, Vx
        else if (instByte1 === 0x18) {
          this.st = this.registers[instNibble1];
          this.sound.setTimer(this.st);
        }
        // Fx1E - ADD I, Vx
        else if (instByte1 === 0x1e) {
          this.registerI = (this.registerI + this.registers[instNibble1]) & 0xffff;
        }
        // Fx29 - LD F, Vx
        else if (instByte1 === 0x29) {
          this.registerI = this.registers[instNibble1] * 5; // Each character sprite is 5 bytes long
        }
        // Fx30 - LD HF, Vx
        else if (instByte1 === 0x30) {
          this.registerI = this.smallChars.length + this.registers[instNibble1] * 10;
        }
        // Fx33 - LD B, Vx
        else if (instByte1 === 0x33) {
          this.memory[this.registerI] = Math.floor(this.registers[instNibble1] / 100); // Hundreds digit
          // TODO: Check if wrap around in case of reaching max memory addr
          this.memory[this.registerI + 1] = Math.floor((this.registers[instNibble1] % 100) / 10); // Tens digit
          this.memory[this.registerI + 2] = Math.floor(this.registers[instNibble1] % 10); // Ones digit
        }
        // XO-Chip pitch
        else if (instByte1 === 0x3a) {
          this.sound.setPitch(this.registers[instNibble1]);
        }
        // Fx55 - LD [I], Vx
        else if (instByte1 === 0x55) {
          // TODO: Check if wrap around in case of reaching max memory addr
          for (let i = 0; i <= instNibble1; i++) {
            this.memory[this.registerI + i] = this.registers[i];
          }
          // TODO: Implement toggling this as a quirk
          this.registerI = (this.registerI + instNibble1 + 1) & 0xffff;
        }
        // Fx65 - LD Vx, [I]
        else if (instByte1 === 0x65) {
          // TODO: Check if wrap around in case of reaching max memory addr
          for (let i = 0; i <= instNibble1; i++) {
            this.registers[i] = this.memory[this.registerI + i];
          }
          // TODO: Implement toggling this as a quirk
          this.registerI = (this.registerI + instNibble1 + 1) & 0xffff;
        }
        // Fx75 - LD R, Vx
        else if (instByte1 === 0x75) {
          for (let i = 0; i <= instNibble1; i++)
            this.flagRegisters[i] = this.registers[i];
          // TODO: Make flag registers persistent
        }
        // Fx85 - LD Vx, R
        else if (instByte1 === 0x85) {
          for (let i = 0; i <= instNibble1; i++)
            this.registers[i] = this.flagRegisters[i];
          // TODO: Make flag registers persistent
        }
        else {
          throw new Error("Unsupported instruction! 0x" + inst.toString(16));
        }
        break;
    }

    this.pc += 2;
  }

  setEmulationSpeed(ticksPerFrame: number) {
    this.timer.setTicksPerFrame(ticksPerFrame);
  }

  setSoundFrequency(freqHz: number) {
    this.sound.setPitch(freqHz);
  }

  setSoundVolume(volume: number) {
    this.sound.setVolume(volume);
  }

  reset() {
    this.timer.stop();
    this.initialize();
    this.initializeChars();
    this.waiting = false;
    this.keyboard.clearWait();
    this.sound.reset();
    this.display.clear();
    this.display.setExtended(false);
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
