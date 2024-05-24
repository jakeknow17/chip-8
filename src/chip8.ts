import { AnimationTimer } from "./browser/animationTimer.js"
import { CanvasDisplay } from "./browser/canvasDisplay.js"
import { Emulator } from "./emulator.js"

let rom: ArrayBuffer | undefined = undefined

const canvas = document.getElementById("canvas") as HTMLCanvasElement | null
if (!canvas)
    throw new Error("Cannot find canvas element")
const fileInput = document.getElementById("file")
const startBtn = document.getElementById("startBtn")

const display = new CanvasDisplay(canvas);
const timer = new AnimationTimer();
const emu = new Emulator(display, timer);

fileInput?.addEventListener("change", event => {
    if (!event.target)
        return;
    const target = event.target as HTMLInputElement;
    const file = target.files?.item(0)
    if (!file) {
        console.log("No file selected")
        return
    }

    const reader = new FileReader()
    reader.onload = event => {
        const result = event.target?.result
        if (result instanceof ArrayBuffer) {
            rom = result
            console.log("Read rom", rom)
        }
    }
    reader.readAsArrayBuffer(file)
})

startBtn?.addEventListener("click", _ => {
    if (!rom) {
        console.error("Rom file must have been loaded")
        return
    }
    emu.load(new Uint8Array(rom))
    emu.start()
})
