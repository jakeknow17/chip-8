import fs from 'fs';
import readline from 'readline';
import { TerminalEmulator } from "../dist/terminalEmulator.js";

let romPath;

function readRomPath() {
  const reader = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise(resolve => reader.question("Please enter the path to your rom: ", ans => {
    reader.close();
    resolve(ans);
  }))
}

function loadRom(path) {
  try {
    const data = fs.readFileSync(path);
    console.log(data);
  }
  catch (err) {
    console.log(err);
    process.exit(1);
  }
}

if (process.argv.length < 3) {
  romPath = await readRomPath();
}
else {
  romPath = process.argv[2];
}

const rom = loadRom(romPath);

const emu = new TerminalEmulator();
emu.load(rom);
emu.start();
