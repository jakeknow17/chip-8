import { Keyboard } from "../abstract/keyboard";

export class BrowserKeyboard extends Keyboard {
  constructor() {
    super();

    document.addEventListener('keydown', (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (key in this.keyMap) {
        this.pressedKeys[this.keyMap[key]] = true;
      }
    });

    document.addEventListener('keyup', (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (key in this.keyMap) {
        this.pressedKeys[this.keyMap[key]] = false;
      }
      if (this.waiting) {
        this.waitingKey = this.keyMap[key];
        this.waiting = false;
      }
    });
  }
}
