const canvas = document.getElementById("canvas");
const fileInput = document.getElementById("file");
const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const continueBtn = document.getElementById("continueBtn");
const speedSlider = document.getElementById("speed");
const frequencySlider = document.getElementById("frequency");
const volumeSlider = document.getElementById("volume");

const emu = new Chip8.WebEmulator(canvas);

let rom = undefined;

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
  emu.setEmulationSpeed(event.target.value);
  console.log(event.target.value);
})

frequencySlider?.addEventListener("input", event => {
  emu.setSoundFrequency(event.target.value);
})

volumeSlider?.addEventListener("input", event => {
  emu.setSoundVolume(event.target.value);
})
