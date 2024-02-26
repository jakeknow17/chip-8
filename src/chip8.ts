
export class Emulator {
    canvas: HTMLCanvasElement
    memory = new Uint8Array(4096)
    rom: Uint8Array | undefined

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas
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
}







