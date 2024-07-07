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
  setPlaneBitmask = jest.fn();
}

class MockTimer implements Timer {
  start = jest.fn();
  stop = jest.fn();
  isRunning = jest.fn(() => false);
  setTickCallback = jest.fn();
  setDrawCallback = jest.fn();
  setTimerCallback = jest.fn();
  setAudioRefreshCallback = jest.fn();
  setTicksPerFrame = jest.fn();
}

class MockKeyboard implements Keyboard {
  isPressed = jest.fn();
  clearWait = jest.fn();
  startWait = jest.fn();
  getWaitKey = jest.fn();
  clearWaitKey = jest.fn();
}

class MockSound implements Sound {
  enable = jest.fn();
  stop = jest.fn();
  reset = jest.fn();
  refresh = jest.fn();
  setTimer = jest.fn();
  setBuffer = jest.fn();
  setPitch = jest.fn();
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
    expect(emulator['memory'][0x200]).toBe(0);
  });

  test('should load ROM into memory', () => {
    const rom = new Uint8Array([0x00, 0xE0, 0x6A, 0x02]);
    emulator.load(rom);
    expect(emulator['memory'][0x200]).toBe(0x00);
    expect(emulator['memory'][0x201]).toBe(0xE0);
    expect(emulator['memory'][0x202]).toBe(0x6A);
    expect(emulator['memory'][0x203]).toBe(0x02);
  });

  test('should halt on 0000 instruction', () => {
    const rom = new Uint8Array([0x00, 0x00]);
    emulator.load(rom);
    emulator.emulateCycle();
    expect(emulator['halted']).toBe(true);
    expect(timer.stop).toHaveBeenCalled();
  });

  test('should scroll down N pixels on 00CN instruction', () => {
    const rom = new Uint8Array([0x00, 0xCE]);
    emulator.load(rom);
    emulator.emulateCycle();
    expect(display.scrollDown).toHaveBeenCalledWith(0xE);
  })

  test('should scroll up N pixels on 00DN instruction', () => {
    const rom = new Uint8Array([0x00, 0xDE]);
    emulator.load(rom);
    emulator.emulateCycle();
    expect(display.scrollUp).toHaveBeenCalledWith(0xE);
  })

  test('should clear display on 00E0 instruction', () => {
    const rom = new Uint8Array([0x00, 0xE0]);
    emulator.load(rom);
    emulator.emulateCycle();
    expect(display.clear).toHaveBeenCalled();
  });

  test('should return from subroutine on 00EE instruction', () => {
    const rom = new Uint8Array([0x22, 0x04, 0x00, 0x00, 0x00, 0xEE]);
    emulator.load(rom);
    emulator.emulateCycle();
    emulator.emulateCycle();
    expect(emulator['pc']).toBe(0x202);
    expect(emulator['sp']).toBe(0);
  });

  test('should scroll right 4 pixels on 00FB instruction', () => {
    const rom = new Uint8Array([0x00, 0xFB]);
    emulator.load(rom);
    emulator.emulateCycle();
    expect(display.scrollRight).toHaveBeenCalledWith(0x4);
  })

  test('should scroll left 4 pixels on 00FC instruction', () => {
    const rom = new Uint8Array([0x00, 0xFC]);
    emulator.load(rom);
    emulator.emulateCycle();
    expect(display.scrollLeft).toHaveBeenCalledWith(0x4);
  })

  test('should exit emulation on 00FD instruction', () => {
    const rom = new Uint8Array([0x00, 0xFD]);
    emulator.load(rom);
    emulator.emulateCycle();
    expect(emulator['halted']).toBe(true);
    expect(timer.stop).toHaveBeenCalled();
  })

  test('should set display to low resolution on 00FE instruction', () => {
    const rom = new Uint8Array([0x00, 0xFE]);
    emulator.load(rom);
    emulator.emulateCycle();
    expect(display.setExtended).toHaveBeenCalledWith(false);
  })

  test('should set display to high resolution on 00FF instruction', () => {
    const rom = new Uint8Array([0x00, 0xFF]);
    emulator.load(rom);
    emulator.emulateCycle();
    expect(display.setExtended).toHaveBeenCalledWith(true);
  })

  test('should handle 1NNN jump instruction', () => {
    const rom = new Uint8Array([0x12, 0x08]);
    emulator.load(rom);
    emulator.emulateCycle();
    expect(emulator['pc']).toBe(0x208);
  });

  test('should call subroutine on 2NNN instruction', () => {
    const rom = new Uint8Array([0x22, 0x08]);
    emulator.load(rom);
    emulator.emulateCycle();
    expect(emulator['pc']).toBe(0x208);
    expect(emulator['sp']).toBe(1);
    expect(emulator['stack'][0]).toBe(0x202);
  });

  test('should skip following instruction when VX == NN on 3XNN instruction', () => {
    const rom = new Uint8Array([0x60, 0x05, 0x61, 0x05, 0x30, 0x05, 0x61, 0x01, 0x60, 0x01]);
    emulator.load(rom);
    emulator.emulateCycle();
    emulator.emulateCycle();
    emulator.emulateCycle();
    emulator.emulateCycle();
    expect(emulator['pc']).toBe(0x20A);
    expect(emulator['registers'][0x0]).toBe(0x01);
    expect(emulator['registers'][0x1]).toBe(0x05);
  })

  test('should not skip following instruction when VX != NN on 3XNN instruction', () => {
    const rom = new Uint8Array([0x60, 0x05, 0x61, 0x05, 0x30, 0x02, 0x61, 0x01, 0x60, 0x01]);
    emulator.load(rom);
    emulator.emulateCycle();
    emulator.emulateCycle();
    emulator.emulateCycle();
    emulator.emulateCycle();
    expect(emulator['pc']).toBe(0x208);
    expect(emulator['registers'][0x0]).toBe(0x05);
    expect(emulator['registers'][0x1]).toBe(0x01);
  })

  test('should correctly skip long load instruction when VX == NN on 3XNN instruction', () => {
    const rom = new Uint8Array([0x60, 0x05, 0x61, 0x05, 0x30, 0x05, 0xF0, 0x00, 0x11, 0x11, 0x60, 0x01]);
    emulator.load(rom);
    emulator.emulateCycle();
    emulator.emulateCycle();
    emulator.emulateCycle();
    emulator.emulateCycle();
    expect(emulator['pc']).toBe(0x20C);
    expect(emulator['registers'][0x0]).toBe(0x01);
    expect(emulator['registers'][0x1]).toBe(0x05);
    expect(emulator['registerI']).not.toBe(0x1111);
    expect(emulator['halted']).toBe(false);
  })

  test('should not skip following instruction when VX == NN on 4XNN instruction', () => {
    const rom = new Uint8Array([0x60, 0x05, 0x61, 0x05, 0x40, 0x05, 0x61, 0x01, 0x60, 0x01]);
    emulator.load(rom);
    emulator.emulateCycle();
    emulator.emulateCycle();
    emulator.emulateCycle();
    emulator.emulateCycle();
    expect(emulator['pc']).toBe(0x208);
    expect(emulator['registers'][0x0]).toBe(0x05);
    expect(emulator['registers'][0x1]).toBe(0x01);
  })

  test('should skip following instruction when VX != NN on 4XNN instruction', () => {
    const rom = new Uint8Array([0x60, 0x05, 0x61, 0x05, 0x40, 0x02, 0x61, 0x01, 0x60, 0x01]);
    emulator.load(rom);
    emulator.emulateCycle();
    emulator.emulateCycle();
    emulator.emulateCycle();
    emulator.emulateCycle();
    expect(emulator['pc']).toBe(0x20A);
    expect(emulator['registers'][0x0]).toBe(0x01);
    expect(emulator['registers'][0x1]).toBe(0x05);
  })

  test('should correctly skip long load instruction when VX != NN on 4XNN instruction', () => {
    const rom = new Uint8Array([0x60, 0x05, 0x61, 0x05, 0x40, 0x02, 0xF0, 0x00, 0x11, 0x11, 0x60, 0x01]);
    emulator.load(rom);
    emulator.emulateCycle();
    emulator.emulateCycle();
    emulator.emulateCycle();
    emulator.emulateCycle();
    expect(emulator['pc']).toBe(0x20C);
    expect(emulator['registers'][0x0]).toBe(0x01);
    expect(emulator['registers'][0x1]).toBe(0x05);
    expect(emulator['registerI']).not.toBe(0x1111);
    expect(emulator['halted']).toBe(false);
  })

  test('should skip following instruction when VX == VY on 5XY0 instruction', () => {
    const rom = new Uint8Array([0x60, 0x05, 0x61, 0x05, 0x50, 0x10, 0x61, 0x01, 0x60, 0x01]);
    emulator.load(rom);
    emulator.emulateCycle();
    emulator.emulateCycle();
    emulator.emulateCycle();
    emulator.emulateCycle();
    expect(emulator['pc']).toBe(0x20A);
    expect(emulator['registers'][0x0]).toBe(0x01);
    expect(emulator['registers'][0x1]).toBe(0x05);
  })

  test('should not skip following instruction when VX != VY on 5XY0 instruction', () => {
    const rom = new Uint8Array([0x60, 0x04, 0x61, 0x05, 0x50, 0x10, 0x61, 0x01, 0x60, 0x01]);
    emulator.load(rom);
    emulator.emulateCycle();
    emulator.emulateCycle();
    emulator.emulateCycle();
    emulator.emulateCycle();
    expect(emulator['pc']).toBe(0x208);
    expect(emulator['registers'][0x0]).toBe(0x04);
    expect(emulator['registers'][0x1]).toBe(0x01);
  })

  test('should correctly skip long load instruction when VX == VY on 5XY0 instruction', () => {
    const rom = new Uint8Array([0x60, 0x05, 0x61, 0x05, 0x50, 0x10, 0xF0, 0x00, 0x11, 0x11, 0x60, 0x01]);
    emulator.load(rom);
    emulator.emulateCycle();
    emulator.emulateCycle();
    emulator.emulateCycle();
    emulator.emulateCycle();
    expect(emulator['pc']).toBe(0x20C);
    expect(emulator['registers'][0x0]).toBe(0x01);
    expect(emulator['registers'][0x1]).toBe(0x05);
    expect(emulator['registerI']).not.toBe(0x1111);
    expect(emulator['halted']).toBe(false);
  })

  test('should set register VX on 6XNN instruction', () => {
    const rom = new Uint8Array([0x60, 0x0A]);
    emulator.load(rom);
    emulator.emulateCycle();
    expect(emulator['registers'][0x0]).toBe(0x0A);
  });

  test('should add value to register VX on 7XNN instruction', () => {
    const rom = new Uint8Array([0x60, 0x0A, 0x70, 0x05]);
    emulator.load(rom);
    emulator.emulateCycle();
    emulator.emulateCycle();
    expect(emulator['registers'][0x0]).toBe(0x0F);
  });

  test('should correctly wrap around on 7XNN instruction', () => {
    const rom = new Uint8Array([0x60, 0xFF, 0x70, 0x02]);
    emulator.load(rom);
    emulator.emulateCycle();
    emulator.emulateCycle();
    expect(emulator['registers'][0x0]).toBe(0x01);
  });

  test('should load register VX with value of VY on 8XY0 instruction', () => {
    const rom = new Uint8Array([0x60, 0x0A, 0x61, 0x0B, 0x80, 0x10]);
    emulator.load(rom);
    emulator.emulateCycle();
    emulator.emulateCycle();
    emulator.emulateCycle();
    expect(emulator['registers'][0x0]).toBe(0x0B);
    expect(emulator['registers'][0x1]).toBe(0x0B);
  });

  test('should OR register VX with VY on 8XY1 instruction', () => {
    const rom = new Uint8Array([0x6F, 0x01, 0x60, 0x0A, 0x61, 0x05, 0x80, 0x11]);
    emulator.load(rom);
    emulator.emulateCycle();
    emulator.emulateCycle();
    emulator.emulateCycle();
    emulator.emulateCycle();
    expect(emulator['registers'][0x0]).toBe(0x0F);
    expect(emulator['registers'][0xF]).toBe(0x01);
  });

  test('should OR register VX with VY on 8XY1 instruction with logic quirk enabled', () => {
    emulator['quirks'].logic = true;
    const rom = new Uint8Array([0x6F, 0x01, 0x60, 0x0A, 0x61, 0x05, 0x80, 0x11]);
    emulator.load(rom);
    emulator.emulateCycle();
    emulator.emulateCycle();
    emulator.emulateCycle();
    emulator.emulateCycle();
    expect(emulator['registers'][0x0]).toBe(0x0F);
    expect(emulator['registers'][0xF]).toBe(0x00);
  });

  test('should AND register VX with VY on 8XY2 instruction', () => {
    const rom = new Uint8Array([0x6F, 0x01, 0x60, 0x0F, 0x61, 0x05, 0x80, 0x12]);
    emulator.load(rom);
    emulator.emulateCycle();
    emulator.emulateCycle();
    emulator.emulateCycle();
    emulator.emulateCycle();
    expect(emulator['registers'][0x0]).toBe(0x05);
    expect(emulator['registers'][0xF]).toBe(0x01);
  });

  test('should AND register VX with VY on 8XY2 instruction with logic quirk enabled', () => {
    emulator['quirks'].logic = true;
    const rom = new Uint8Array([0x6F, 0x01, 0x60, 0x0F, 0x61, 0x05, 0x80, 0x12]);
    emulator.load(rom);
    emulator.emulateCycle();
    emulator.emulateCycle();
    emulator.emulateCycle();
    emulator.emulateCycle();
    expect(emulator['registers'][0x0]).toBe(0x05);
    expect(emulator['registers'][0xF]).toBe(0x00);
  });

  test('should XOR register VX with VY on 8XY3 instruction', () => {
    const rom = new Uint8Array([0x6F, 0x01, 0x60, 0x0F, 0x61, 0x05, 0x80, 0x13]);
    emulator.load(rom);
    emulator.emulateCycle();
    emulator.emulateCycle();
    emulator.emulateCycle();
    emulator.emulateCycle();
    expect(emulator['registers'][0x0]).toBe(0x0A);
    expect(emulator['registers'][0xF]).toBe(0x01);
  });

  test('should XOR register VX with VY on 8XY3 instruction with logic quirk enabled', () => {
    emulator['quirks'].logic = true;
    const rom = new Uint8Array([0x6F, 0x01, 0x60, 0x0F, 0x61, 0x05, 0x80, 0x13]);
    emulator.load(rom);
    emulator.emulateCycle();
    emulator.emulateCycle();
    emulator.emulateCycle();
    emulator.emulateCycle();
    expect(emulator['registers'][0x0]).toBe(0x0A);
    expect(emulator['registers'][0xF]).toBe(0x00);
  });

  test('should ADD register VY to VX and set carry on 8XY4 instruction', () => {
    const rom = new Uint8Array([0x6F, 0x02, 0x60, 0xFF, 0x61, 0x01, 0x80, 0x14]);
    emulator.load(rom);
    emulator.emulateCycle();
    emulator.emulateCycle();
    emulator.emulateCycle();
    emulator.emulateCycle();
    expect(emulator['registers'][0x0]).toBe(0x00);
    expect(emulator['registers'][0xF]).toBe(0x01);
  });

  test('should ADD register VY to VX and not set carry on 8XY4 instruction', () => {
    const rom = new Uint8Array([0x6F, 0x02, 0x60, 0x02, 0x61, 0x01, 0x80, 0x14]);
    emulator.load(rom);
    emulator.emulateCycle();
    emulator.emulateCycle();
    emulator.emulateCycle();
    emulator.emulateCycle();
    expect(emulator['registers'][0x0]).toBe(0x03);
    expect(emulator['registers'][0xF]).toBe(0x00);
  });

  test('should set flag after ADD on 8XY4 instruction', () => {
    const rom = new Uint8Array([0x60, 0xFF, 0x6F, 0x03, 0x8F, 0x04]);
    emulator.load(rom);
    emulator.emulateCycle();
    emulator.emulateCycle();
    emulator.emulateCycle();
    expect(emulator['registers'][0xF]).toBe(0x01);
  });

  test('should set flag before ADD on 8XY4 instruction with vfOrder quirk enabled', () => {
    emulator['quirks'].vfOrder = true;
    const rom = new Uint8Array([0x60, 0xFF, 0x6F, 0x03, 0x8F, 0x04]);
    emulator.load(rom);
    emulator.emulateCycle();
    emulator.emulateCycle();
    emulator.emulateCycle();
    expect(emulator['registers'][0xF]).toBe(0x02);
  });

  test('should SUB register VY from VX and not borrow on 8XY5 instruction', () => {
    const rom = new Uint8Array([0x6F, 0x02, 0x60, 0x03, 0x61, 0x01, 0x80, 0x15]);
    emulator.load(rom);
    emulator.emulateCycle();
    emulator.emulateCycle();
    emulator.emulateCycle();
    emulator.emulateCycle();
    expect(emulator['registers'][0x0]).toBe(0x02);
    expect(emulator['registers'][0xF]).toBe(0x01);
  });

  test('should SUB register VY from VX and borrow on 8XY5 instruction', () => {
    const rom = new Uint8Array([0x6F, 0x02, 0x60, 0x01, 0x61, 0x03, 0x80, 0x15]);
    emulator.load(rom);
    emulator.emulateCycle();
    emulator.emulateCycle();
    emulator.emulateCycle();
    emulator.emulateCycle();
    expect(emulator['registers'][0x0]).toBe(0xFE);
    expect(emulator['registers'][0xF]).toBe(0x00);
  });

  test('should set flag after SUB on 8XY5 instruction', () => {
    const rom = new Uint8Array([0x6F, 0x04, 0x60, 0x02, 0x8F, 0x05]);
    emulator.load(rom);
    emulator.emulateCycle();
    emulator.emulateCycle();
    emulator.emulateCycle();
    expect(emulator['registers'][0xF]).toBe(0x01);
  });

  test('should set flag before SUB on 8XY5 instruction with vfOrder quirk enabled', () => {
    emulator['quirks'].vfOrder = true;
    const rom = new Uint8Array([0x6F, 0x04, 0x60, 0x02, 0x8F, 0x05]);
    emulator.load(rom);
    emulator.emulateCycle();
    emulator.emulateCycle();
    emulator.emulateCycle();
    expect(emulator['registers'][0xF]).toBe(0x02);
  });

  test('should shift VY right by one and store in VX, set VF to LSB (1) of VY on 8XY6 instruction', () => {
    const rom = new Uint8Array([0x60, 0x00, 0x61, 0x03, 0x80, 0x16]);
    emulator.load(rom);
    emulator.emulateCycle();
    emulator.emulateCycle();
    emulator.emulateCycle();
    expect(emulator['registers'][0x0]).toBe(0x01);
    expect(emulator['registers'][0xF]).toBe(0x01);
    expect(emulator['registers'][0x1]).toBe(0x03);
  });

  test('should ignore VY register on 8XY6 instruction with shift quirk enabled', () => {
    emulator['quirks'].shift = true;
    const rom = new Uint8Array([0x60, 0x08, 0x61, 0x03, 0x80, 0x16]);
    emulator.load(rom);
    emulator.emulateCycle();
    emulator.emulateCycle();
    emulator.emulateCycle();
    expect(emulator['registers'][0x0]).toBe(0x04);
    expect(emulator['registers'][0xF]).toBe(0x00);
    expect(emulator['registers'][0x1]).toBe(0x03);
  });

  test('should shift VY right by one and store in VX, set VF to LSB (0) of VY on 8XY6 instruction', () => {
    const rom = new Uint8Array([0x60, 0x00, 0x61, 0x02, 0x80, 0x16]);
    emulator.load(rom);
    emulator.emulateCycle();
    emulator.emulateCycle();
    emulator.emulateCycle();
    expect(emulator['registers'][0x0]).toBe(0x01);
    expect(emulator['registers'][0xF]).toBe(0x00);
    expect(emulator['registers'][0x1]).toBe(0x02);
  });

  test('should not take sign bit into account on 8XY6 instruction', () => {
    const rom = new Uint8Array([0x60, 0x00, 0x61, 0xFF, 0x80, 0x16]);
    emulator.load(rom);
    emulator.emulateCycle();
    emulator.emulateCycle();
    emulator.emulateCycle();
    expect(emulator['registers'][0x0]).toBe(0x7F);
    expect(emulator['registers'][0xF]).toBe(0x01);
    expect(emulator['registers'][0x1]).toBe(0xFF);
  });

  test('should set flag after shift on 8XY7 instruction', () => {
    const rom = new Uint8Array([0x6F, 0x02, 0x60, 0x02, 0x8F, 0x06]);
    emulator.load(rom);
    emulator.emulateCycle();
    emulator.emulateCycle();
    emulator.emulateCycle();
    expect(emulator['registers'][0xF]).toBe(0x00);
  });

  test('should set flag before shift on 8XY7 instruction with vfOrder quirk enabled', () => {
    emulator['quirks'].vfOrder = true;
    const rom = new Uint8Array([0x6F, 0x02, 0x60, 0x04, 0x8F, 0x06]);
    emulator.load(rom);
    emulator.emulateCycle();
    emulator.emulateCycle();
    emulator.emulateCycle();
    expect(emulator['registers'][0xF]).toBe(0x02);
  });

  test('should SUBN register VX from VY and not borrow on 8XY7 instruction', () => {
    const rom = new Uint8Array([0x6F, 0x02, 0x60, 0x01, 0x61, 0x03, 0x80, 0x17]);
    emulator.load(rom);
    emulator.emulateCycle();
    emulator.emulateCycle();
    emulator.emulateCycle();
    emulator.emulateCycle();
    expect(emulator['registers'][0x0]).toBe(0x02);
    expect(emulator['registers'][0xF]).toBe(0x01);
  });

  test('should SUBN register VX from VY and borrow on 8XY7 instruction', () => {
    const rom = new Uint8Array([0x6F, 0x02, 0x60, 0x03, 0x61, 0x01, 0x80, 0x17]);
    emulator.load(rom);
    emulator.emulateCycle();
    emulator.emulateCycle();
    emulator.emulateCycle();
    emulator.emulateCycle();
    expect(emulator['registers'][0x0]).toBe(0xFE);
    expect(emulator['registers'][0xF]).toBe(0x00);
  });

  test('should set flag after SUBN on 8XY7 instruction', () => {
    const rom = new Uint8Array([0x6F, 0x02, 0x60, 0x04, 0x8F, 0x07]);
    emulator.load(rom);
    emulator.emulateCycle();
    emulator.emulateCycle();
    emulator.emulateCycle();
    expect(emulator['registers'][0xF]).toBe(0x01);
  });

  test('should set flag before SUBN on 8XY7 instruction with vfOrder quirk enabled', () => {
    emulator['quirks'].vfOrder = true;
    const rom = new Uint8Array([0x6F, 0x02, 0x60, 0x04, 0x8F, 0x07]);
    emulator.load(rom);
    emulator.emulateCycle();
    emulator.emulateCycle();
    emulator.emulateCycle();
    expect(emulator['registers'][0xF]).toBe(0x02);
  });

  test('should shift VY left by one and store in VX, set VF to MSB (1) of VY on 8XYE instruction', () => {
    const rom = new Uint8Array([0x60, 0x00, 0x61, 0x80, 0x80, 0x1E]);
    emulator.load(rom);
    emulator.emulateCycle();
    emulator.emulateCycle();
    emulator.emulateCycle();
    expect(emulator['registers'][0x0]).toBe(0x00);
    expect(emulator['registers'][0xF]).toBe(0x01);
    expect(emulator['registers'][0x1]).toBe(0x80);
  });

  test('should ignore VY register on 8XYE instruction with shift quirk enabled', () => {
    emulator['quirks'].shift = true;
    const rom = new Uint8Array([0x60, 0x40, 0x61, 0xF0, 0x80, 0x1E]);
    emulator.load(rom);
    emulator.emulateCycle();
    emulator.emulateCycle();
    emulator.emulateCycle();
    expect(emulator['registers'][0x0]).toBe(0x80);
    expect(emulator['registers'][0xF]).toBe(0x00);
    expect(emulator['registers'][0x1]).toBe(0xF0);
  });

  test('should shift VY left by one and store in VX, set VF to MSB (0) of VY on 8XYE instruction', () => {
    const rom = new Uint8Array([0x60, 0x00, 0x61, 0x40, 0x80, 0x1E]);
    emulator.load(rom);
    emulator.emulateCycle();
    emulator.emulateCycle();
    emulator.emulateCycle();
    expect(emulator['registers'][0x0]).toBe(0x80);
    expect(emulator['registers'][0xF]).toBe(0x00);
    expect(emulator['registers'][0x1]).toBe(0x40);
  });

  test('should set flag after shift on 8XYE instruction', () => {
    const rom = new Uint8Array([0x6F, 0x80, 0x60, 0x80, 0x8F, 0x0E]);
    emulator.load(rom);
    emulator.emulateCycle();
    emulator.emulateCycle();
    emulator.emulateCycle();
    expect(emulator['registers'][0xF]).toBe(0x01);
  });

  test('should set flag before shift on 8XYE instruction with vfOrder quirk enabled', () => {
    emulator['quirks'].vfOrder = true;
    const rom = new Uint8Array([0x6F, 0x80, 0x60, 0x40, 0x8F, 0x0E]);
    emulator.load(rom);
    emulator.emulateCycle();
    emulator.emulateCycle();
    emulator.emulateCycle();
    expect(emulator['registers'][0xF]).toBe(0x80);
  });
});
