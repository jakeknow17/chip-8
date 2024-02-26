
export class Emulator {
    canvas: HTMLCanvasElement
    memory = new Uint8Array(4096)

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas
    }
}







