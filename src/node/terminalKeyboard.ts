import { Keyboard } from "../interfaces/keyboard";

export class TerminalKeyboard implements Keyboard {
  isPressed(key: number): boolean {
    return key ? true : false;
  }

  clearWait(): void {

  }

  startWait(): void {

  }

  getWaitKey(): number | null {
    return null;
  }

  clearWaitKey(): void {

  }
}
