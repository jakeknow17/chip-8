import { Display } from "./display.js";

export class Emulator {
  static readonly MEM_SIZE = 4096;
  static readonly STACK_SIZE = 16;
  static readonly NUM_REGS = 16;
  static readonly PROG_START_ADDR = 0x200;

  memory = new Uint8Array(Emulator.MEM_SIZE);
  stack = new Uint16Array(Emulator.STACK_SIZE);
  display: Display;
  rom: Uint8Array | undefined;

  pc = Emulator.PROG_START_ADDR;
  sp = Emulator.STACK_SIZE;
  registers = new Uint8Array(Emulator.NUM_REGS);
  registerI = 0;

  constructor(display: Display) {
    this.display = display;
    this.initialize();
  }

  load(rom: Uint8Array) {
    this.rom = new Uint8Array(rom);
    this.memory.set(this.rom, Emulator.PROG_START_ADDR);
  }

  initialize() {
    this.pc = Emulator.PROG_START_ADDR;
    this.sp = Emulator.STACK_SIZE;
    this.registers.fill(0);
    this.registerI = 0;
  }

  emulateCycle() {
    console.log("Emulating...")

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
        // 00E0 - CLS
        if (instByte1 === 0xe0)
          this.display.clear();
        // 00EE - RET
        // TODO: Implement RET - Return from a subroutine.
        break;
      case 0x1:
        // 1nnn - JP addr
        this.pc = inst & 0xfff;
        break;
      case 0x2:
        // 2nnn - CALL addr
        // TODO: Implement CALL - Call subroutine at nnn.
        break;
      case 0x3:
        // 3xkk - SE Vx, byte
        if (this.registers[instNibble1] == instByte1)
          this.pc += 2;
        break;
      case 0x4:
        // 4xkk - SNE Vx, byte
        // TODO: Implement SNE - Skip next instruction if Vx != kk
        break;
      case 0x5:
        // 5xy0 - SE Vx, Vy
        // TODO: Implement SE - Skip next instruction if Vx == Vy
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
        if ((instNibble3) == 0x0) {
          this.registers[instNibble1] = this.registers[instNibble2];
        }
        // 8xy1 - OR Vx, Vy
        else if ((instNibble3) == 0x1) {
          this.registers[instNibble1] |= this.registers[instNibble2];
        }
        // 8xy2 - AND Vx, Vy
        else if ((instNibble3) == 0x2) {
          this.registers[instNibble1] &= this.registers[instNibble2];
        }
        // 8xy3 - XOR Vx, Vy
        else if ((instNibble3) == 0x3) {
          this.registers[instNibble1] ^= this.registers[instNibble2];
        }
        // 8xy4 - ADD Vx, Vy
        else if ((instNibble3) == 0x4) {
          const sum = this.registers[instNibble1] + this.registers[instNibble2];
          this.registers[instNibble1] = sum & 0xff; // Truncate value to 8 bits
          this.registers[0xf] = sum > 0xff ? 1 : 0; // Overflow
        }
        // 8xy5 - SUB Vx, Vy
        else if ((instNibble3) == 0x5) {
          const diff = this.registers[instNibble1] - this.registers[instNibble2];
          this.registers[instNibble1] = diff & 0xff; // Truncate value to 8 bits
          this.registers[0xf] = diff < 0 ? 1 : 0; // Overflow
        }
        // 8xy6 - SHR Vx {, Vy}
        else if ((instNibble3) == 0x6) {
          // Vy is ignored in this instruction
          this.registers[instNibble1] >>>= 1;
        }
        // 8xy7 - SUBN Vx, Vy
        else if ((instNibble3) == 0x5) {
          const diff = this.registers[instNibble2] - this.registers[instNibble1];
          this.registers[instNibble1] = diff & 0xff; // Truncate value to 8 bits
          this.registers[0xf] = diff < 0 ? 1 : 0; // Overflow
        }
        // 8xyE - SHL Vx, Vy
        else if ((instNibble3) == 0x6) {
          // Vy is ignored in this instruction
          this.registers[instNibble1] <<= 1;
        }
        break
      case 0x9:
        break;
      case 0xa:
        const addr = inst & 0xfff;
        this.registerI = addr;
        break
      case 0xb:
        this.pc = (inst & 0xfff) + this.registers[0x0];
        break;
      case 0xc:
        break;
      case 0xd:
        const sprite = this.memory.slice(this.registerI, this.registerI + instNibble3);
        if (this.display.drawSprite(sprite, this.registers[instNibble1], this.registers[instNibble2]))
          this.registers[0xf] = 1;
        else
          this.registers[0xf] = 0;
        break
      case 0xf:
        break;
    }

    this.pc += 2;
  }

  start() {
    if (!this.rom) {
      console.log("No ROM loaded");
      return;
    }

    this.initialize();

    let count = 0;
    while (count < 1_000) {
      this.emulateCycle();
      count++;
    }
  }

}
