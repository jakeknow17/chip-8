import fs from 'fs';
import readline from 'readline';
import { TerminalEmulator } from "../dist/terminalEmulator.js";
import { LogLevel } from '../dist/abstract/logger.js';

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
    return fs.readFileSync(path);
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
emu.setLogLevel(LogLevel.DEBUG);
emu.setEmulationSpeed(1000);
emu.load(rom);
emu.start();
