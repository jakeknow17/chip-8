const MEM_SIZE = 4096
const NUM_REGS = 16

class Display {
    canvas: HTMLCanvasElement
    ctx: CanvasRenderingContext2D | null = null
    resizeObserver: ResizeObserver

    width: number
    height: number

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas
        this.ctx = this.getContext()
        
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
    }

    /**
     * Gets a context for the canvas. Only attempts to get a new context if the current one is null.
     * @returns {CanvasRenderingContext2D | null} The context for the canvas property, or null if it fails to get a valid context.
     */
    getContext(): CanvasRenderingContext2D | null {
        if (this.ctx)
            return this.ctx

        this.ctx = this.canvas.getContext("2d")
        return this.ctx
    }
}

export class Emulator {
    memory = new Uint8Array(MEM_SIZE)
    display: Display
    rom: Uint8Array | undefined

    pc = 0
    registers = new Uint8Array(NUM_REGS)

    constructor(canvas: HTMLCanvasElement) {
        this.display = new Display(canvas)
        this.initialize()
    }

    load(romFile: File) {
        const reader = new FileReader()
        reader.onload = event => {
            const result = event.target?.result
            if (result instanceof ArrayBuffer)
                this.rom = new Uint8Array(result)
        }
        reader.readAsArrayBuffer(romFile)
    }

    initialize() {
        this.pc = 0
    }

    start() {
        if (!this.rom) {
            console.log("No ROM loaded")
            return
        }

        this.initialize()

        switch (this.rom[this.pc]) {
            case 0x00:
                break
            case 0x01:
                break
            case 0x02:
                break
            case 0x03:
                break
            case 0x04:
                break
            case 0x05:
                break
            case 0x06:
                break
            case 0x06:
                break
            case 0x07:
                break
            case 0x08:
                break
            case 0x09:
                break
            case 0x0a:
                break
            case 0x0b:
                break
            case 0x0c:
                break
            case 0x0d:
                break
            case 0x0f:
                break
        }
    }

}







