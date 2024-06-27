import { TimeoutTimer } from "../dist/browser/timeoutTimer.js";
import { CanvasDisplay } from "../dist/browser/canvasDisplay.js";
import { BrowserKeyboard } from "../dist/browser/browserKeyboard.js";
import { BrowserSound } from "../dist/browser/browserSound.js";
import { Emulator } from "../dist/emulator.js";

let rom = undefined;

const canvas = document.getElementById("canvas");
const fileInput = document.getElementById("file");
const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const continueBtn = document.getElementById("continueBtn");
const speedSlider = document.getElementById("speed");
const frequencySlider = document.getElementById("frequency");
const volumeSlider = document.getElementById("volume");

const display = new CanvasDisplay(canvas);
const cycleTimer = new TimeoutTimer();
const keyboard = new BrowserKeyboard();
const sound = new BrowserSound();
const emu = new Emulator(display, cycleTimer, keyboard, sound);

fileInput?.addEventListener("change", event => {
  if (!event.target)
    return;
  const target = event.target;
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

stopBtn?.addEventListener("click", _ => {
  emu.stop();
})

continueBtn?.addEventListener("click", _ => {
  emu.continue();
})

speedSlider?.addEventListener("input", event => {
  cycleTimer.setTicksPerSecond(event.target.value);
  console.log(event.target.value);
})

frequencySlider?.addEventListener("input", event => {
  sound.setFrequency(event.target.value);
})

volumeSlider?.addEventListener("input", event => {
  sound.setVolume(event.target.value);
})
