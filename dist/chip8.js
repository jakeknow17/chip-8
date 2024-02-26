export class Emulator {
    canvas;
    memory = new Uint8Array(4096);
    rom;
    constructor(canvas) {
        this.canvas = canvas;
    }
    load(romFile) {
        const reader = new FileReader();
        reader.onload = event => {
            const result = event.target?.result;
            if (result instanceof ArrayBuffer)
                this.rom = new Uint8Array(result);
        };
        reader.readAsArrayBuffer(romFile);
    }
}
//# sourceMappingURL=chip8.js.map