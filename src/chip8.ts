const BYTE_SIZE = 8

class Display {
    static readonly SCREEN_WIDTH = 64;
    static readonly SCREEN_HEIGHT = 32;

    canvas: HTMLCanvasElement
    ctx: CanvasRenderingContext2D
    resizeObserver: ResizeObserver

    screen: Array<Boolean>

    width: number
    height: number

    clearColor = "#996700"
    solidColor = "#ffcc01"

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas

        // Make sure the context is valid
        const ctx = this.canvas.getContext("2d")
        if (!ctx)
            throw new Error("Unable to obtain 2D context from the canvas")
        this.ctx = ctx

        // Get canvas dimensions
        const { width, height } = canvas.getBoundingClientRect()
        this.width = width
        this.height = height

        // Watch for changes in dimensions
        this.resizeObserver = new ResizeObserver(entries => {
            for (let entry of entries) {
                this.width = entry.contentRect.width
                this.height = entry.contentRect.height
            }
            console.log("Dimensions changed", entries)
        })
        this.resizeObserver.observe(canvas)

        // Setup screen
        this.screen = new Array<Boolean>(Display.SCREEN_WIDTH * Display.SCREEN_WIDTH)
        this.clear()
    }

    clear() {
        // Clear the screen representation
        this.screen.fill(false)

        // Clear the screen
        this.ctx.fillStyle = this.clearColor
        this.ctx.fillRect(0, 0, this.width, this.height)
    }

    drawPixel(set: boolean, x: number, y: number) {
        const xStep = this.width / Display.SCREEN_WIDTH
        const yStep = this.height / Display.SCREEN_HEIGHT

        const index = y * Display.SCREEN_WIDTH + x

        const prev = this.screen[index]
        this.screen[index] = this.screen[index] !== set

        const collision = prev && !this.screen[index]

        this.ctx.fillStyle = this.screen[index] ? this.solidColor : this.clearColor;

        this.ctx.fillRect(x * xStep, y * yStep, xStep, yStep)

        return collision
    }

    drawByte(byte: number, x: number, y: number) {
        let collision = false

        for (let i = 0; i < BYTE_SIZE; i++) {
            const isSet = Boolean(byte & (0x80 >> i))
            collision ||= this.drawPixel(isSet, (x + i) % Display.SCREEN_WIDTH, y);
        }

        return collision
    }

    drawSprite(sprite: Uint8Array, x: number, y: number) {
        let collision = false

        for (let i = 0; i < sprite.length; i++)
            collision ||= this.drawByte(sprite[i], x, (y + i) % Display.SCREEN_HEIGHT)

        return collision
    }
}

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

    constructor(canvas: HTMLCanvasElement) {
        this.display = new Display(canvas)
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
