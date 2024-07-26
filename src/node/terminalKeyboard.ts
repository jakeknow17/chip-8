import { Terminal } from "terminal-kit";
import { Keyboard } from "../abstract/keyboard.js";

export class TerminalKeyboard extends Keyboard {
  terminal: Terminal

  constructor(terminal: Terminal) {
    super();

    this.terminal = terminal;
    this.terminal.grabInput(true);
    this.terminal.on("key", (name: string) => {
      if (name === "CTRL_C" || name === "ESCAPE") {
        this.terminal.grabInput(false);
        this.terminal.hideCursor(false);
        this.terminal.processExit(0);
      }
      if (name in this.keyMap) {
        this.pressedKeys[this.keyMap[name]] = true;
        if (this.waiting) {
          this.waitingKey = this.keyMap[name];
          this.waiting = false;
          this.pressedKeys[this.keyMap[name]] = false;
        }
      }

    })

    setInterval(() => {
      for (let key in this.pressedKeys)
        this.pressedKeys[key] = false;
    }, 50);
  }
}
