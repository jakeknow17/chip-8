import { Display } from "./display.js"

export class Emulator {
    static readonly MEM_SIZE = 4096
    static readonly STACK_SIZE = 16
    static readonly NUM_REGS = 16
    static readonly PROG_START_ADDR = 0x200

    memory = new Uint8Array(Emulator.MEM_SIZE)
    stack = new Uint16Array(Emulator.STACK_SIZE)
    display: Display
    rom: Uint8Array | undefined

    pc = Emulator.PROG_START_ADDR
    sp = Emulator.STACK_SIZE
    registers = new Uint8Array(Emulator.NUM_REGS)
    registerI = 0

    constructor(display: Display) {
        this.display = display;
        this.initialize()
    }

    load(rom: Uint8Array) {
        this.rom = new Uint8Array(rom)
        this.memory.set(this.rom, Emulator.PROG_START_ADDR)
    }

    initialize() {
        this.pc = Emulator.PROG_START_ADDR
        this.sp = Emulator.STACK_SIZE
        this.registers.fill(0)
        this.registerI = 0
    }

    emulateCycle() {
        console.log("Emulating...")

        const inst0: number = this.memory[this.pc]
        const inst1: number = this.memory[this.pc + 1]
        const inst = (inst0 << 8) | inst1

        switch (inst0 & 0xf0) {
            case 0x00:
                if (inst1 === 0xe0)
                    this.display.clear()
                break
            case 0x10:
                this.pc = inst & 0xfff
                break
            case 0x20:
                break
            case 0x30:
                break
            case 0x40:
                break
            case 0x50:
                break
            case 0x60:
                const regIdx = inst0 & 0xf
                console.log("Setting register ", regIdx, " to ", inst1)
                this.registers[regIdx] = inst1
                break
            case 0x70:
                this.registers[inst0 & 0xf] += inst1
                break
            case 0x80:
                break
            case 0x90:
                break
            case 0xa0:
                const addr = inst & 0xfff
                this.registerI = addr
                break
            case 0xb0:
                this.pc = (inst & 0xfff) + this.registers[inst0 & 0x0f]
                break
            case 0xc0:
                break
            case 0xd0:
                const reg1Idx = inst0 & 0x0f
                const reg2Idx = (inst1 >> 0x4) & 0x0f
                const numBytes = inst1 & 0x0f
                const sprite = this.memory.slice(this.registerI, this.registerI + numBytes)
                if (this.display.drawSprite(sprite, this.registers[reg1Idx], this.registers[reg2Idx]))
                    this.registers[Emulator.NUM_REGS - 1] = 1
                else
                    this.registers[Emulator.NUM_REGS - 2] = 0
                break
            case 0xf0:
                break
        }

        this.pc += 2
    }

    start() {
        if (!this.rom) {
            console.log("No ROM loaded")
            return
        }

        this.initialize()

        let count = 0
        while (count < 1_000) {
            this.emulateCycle()
            count++
        }
    }

}