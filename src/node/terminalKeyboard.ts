import { Terminal } from "terminal-kit";
import { Keyboard } from "../abstract/keyboard.js";

export class TerminalKeyboard extends Keyboard {
  terminal: Terminal

  constructor(terminal: Terminal) {
    super();

    this.terminal = terminal;
  }
}
