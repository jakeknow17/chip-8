import { Emulator } from "../src/emulator";
import { Display } from "../src/interfaces/display";
import { Timer } from "../src/interfaces/timer";
import { Keyboard } from "../src/interfaces/keyboard";
import { Sound } from "../src/interfaces/sound";

class MockDisplay implements Display {
  drawScreen = jest.fn();
  setExtended = jest.fn();
  setOnColor = jest.fn();
  setOffColor = jest.fn();
  clear = jest.fn();
  drawSprite = jest.fn(() => false);
  scrollDown = jest.fn();
  scrollUp = jest.fn();
  scrollRight = jest.fn();
  scrollLeft = jest.fn();
}

class MockTimer implements Timer {
  setTickCallback = jest.fn();
  setDrawCallback = jest.fn();
  start = jest.fn();
  stop = jest.fn();
  isRunning = jest.fn(() => false);
  setTicksPerFrame = jest.fn();
}

class MockKeyboard implements Keyboard {
  isPressed = jest.fn();
  clearWait = jest.fn();
  startWait = jest.fn();
  getWaitKey = jest.fn(() => null);
  clearWaitKey = jest.fn();
}

class MockSound implements Sound {
  start = jest.fn();
  stop = jest.fn();
  isPlaying = jest.fn(() => false);
  setFrequency = jest.fn();
  setVolume = jest.fn();
}

describe('Emulator', () => {
  let display: MockDisplay;
  let timer: MockTimer;
  let keyboard: MockKeyboard;
  let sound: MockSound;
  let emulator: Emulator;

  beforeEach(() => {
    display = new MockDisplay();
    timer = new MockTimer();
    keyboard = new MockKeyboard();
    sound = new MockSound();
    emulator = new Emulator(display, timer, keyboard, sound);
  });

  test('should initialize memory, registers, and program counter', () => {
    expect(emulator['pc']).toBe(Emulator.PROG_START_ADDR);
    expect(emulator['sp']).toBe(0);
    expect(emulator['registers'].every(reg => reg === 0)).toBe(true);
    expect(emulator['memory'][0x200]).toBe(0);  // Check if memory at 0x200 is 0 (initial state)
  });

  test('should load ROM into memory', () => {
    const rom = new Uint8Array([0x00, 0xE0, 0x6A, 0x02]);  // Some test instructions
    emulator.load(rom);
    expect(emulator['memory'][0x200]).toBe(0x00);
    expect(emulator['memory'][0x201]).toBe(0xE0);
    expect(emulator['memory'][0x202]).toBe(0x6A);
    expect(emulator['memory'][0x203]).toBe(0x02);
  });

  test('should clear display on 00E0 instruction', () => {
    const rom = new Uint8Array([0x00, 0xE0]);
    emulator.load(rom);
    emulator.emulateCycle();
    expect(display.clear).toHaveBeenCalled();
  });

  test('should set register Vx on 6xkk instruction', () => {
    const rom = new Uint8Array([0x60, 0x0A]);  // 6xkk: LD Vx, byte
    emulator.load(rom);
    emulator.emulateCycle();
    expect(emulator['registers'][0x0]).toBe(0x0A);
  });

  test('should add value to register Vx on 7xkk instruction', () => {
    const rom = new Uint8Array([0x60, 0x0A, 0x70, 0x05]);  // 6xkk: LD Vx, byte and 7xkk: ADD Vx, byte
    emulator.load(rom);
    emulator.emulateCycle();
    emulator.emulateCycle();
    expect(emulator['registers'][0x0]).toBe(0x0F);
  });

  test('should handle 1nnn jump instruction', () => {
    const rom = new Uint8Array([0x12, 0x08]);  // 1nnn: JP addr
    emulator.load(rom);
    emulator.emulateCycle();
    expect(emulator['pc']).toBe(0x208);
  });

  test('should call subroutine with 2nnn instruction', () => {
    const rom = new Uint8Array([0x22, 0x08]);  // 2nnn: CALL addr
    emulator.load(rom);
    emulator.emulateCycle();
    expect(emulator['pc']).toBe(0x208);
    expect(emulator['sp']).toBe(1);
    expect(emulator['stack'][0]).toBe(0x202);
  });

  test('should return from subroutine with 00EE instruction', () => {
    const rom = new Uint8Array([0x22, 0x04, 0x00, 0x00, 0x00, 0xEE]);  // 2nnn: CALL addr and 00EE: RET
    emulator.load(rom);
    emulator.emulateCycle();
    emulator.emulateCycle();
    expect(emulator['pc']).toBe(0x202);
    expect(emulator['sp']).toBe(0);
  });
});
