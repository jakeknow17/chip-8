type KeyMap = { [key: string]: number };
type PressedKeys = { [key: number]: boolean };

export abstract class Keyboard {
  protected keyMap: KeyMap = {
    '1': 0x1, '2': 0x2, '3': 0x3, '4': 0xC,
    'q': 0x4, 'w': 0x5, 'e': 0x6, 'r': 0xD,
    'a': 0x7, 's': 0x8, 'd': 0x9, 'f': 0xE,
    'z': 0xA, 'x': 0x0, 'c': 0xB, 'v': 0xF
  };

  protected pressedKeys: PressedKeys = {
    0x1: false, 0x2: false, 0x3: false, 0xC: false,
    0x4: false, 0x5: false, 0x6: false, 0xD: false,
    0x7: false, 0x8: false, 0x9: false, 0xE: false,
    0xA: false, 0x0: false, 0xB: false, 0xF: false
  };

  protected waiting: boolean;
  protected waitingKey: number | null;

  constructor() {
    this.waiting = false;
    this.waitingKey = null;
  }

  isPressed(key: number): boolean {
    if (key < 0x0 || key > 0xf)
      return false;
    return this.pressedKeys[key];
  }

  startWait(): void {
    this.waiting = true;
  }

  clearWait(): void {
    this.waiting = false;
    this.clearWaitKey();
  }

  getWaitKey(): number | null {
    return this.waitingKey;
  }

  clearWaitKey(): void {
    this.waitingKey = null;
  }
}
