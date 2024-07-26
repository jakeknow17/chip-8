import terminalKit, { ScreenBuffer, Terminal } from "terminal-kit";

import { Display } from "../abstract/display.js"

export class TerminalDisplay extends Display {
  lowResChars = [' ', '█']
  highResChars = [' ', '▘', '▝', '▀', '▖', '▌', '▞', '▛', '▗', '▚', '▐', '▜', '▄', '▙', '▟', '█']

  terminal: Terminal;
  screenBuffer: ScreenBuffer;

  i = 0;

  constructor(terminal: Terminal) {
    super();

    this.terminal = terminal;
    this.terminal.fullscreen(true);
    this.terminal.hideCursor();

    // this.terminal.inputField((_, name) => {
    //   this.terminal.green("\nHello!\n", name, "\n");
    //   process.exit();
    // })

    this.screenBuffer = new terminalKit.ScreenBuffer({
      dst: this.terminal
    });
    // this.screenBuffer.put({
    //   x: 0,
    //   y: 0,
    //   attr: 255,
    //   wrap: false,
    //   dx: 1,
    //   dy: 0
    // }, `Hello ${i++}\nTest`)
    // this.screenBuffer.draw();
  }

  clear(): void {
    // Clear the screen representation
    for (let i = 0; i < this.screen.length; i++) {
      this.screen[i].fill(false);
      this.prevScreen[i].fill(false);
    }

    this.isLayerChanged.fill(false);

    this.drawScreen();
  }

  drawScreen(): void {
    if (this.isLayerChanged.every(item => item === false))
      return;

    let screenStr: Array<string> = [];

    if (this.screenWidth === TerminalDisplay.LOW_RES_WIDTH && this.screenHeight === TerminalDisplay.LOW_RES_HEIGHT) {
      screenStr = new Array<string>(this.screenHeight);
      for (let i = 0; i < TerminalDisplay.LOW_RES_HEIGHT; i++) {
        let line = "";
        for (let j = 0; j < TerminalDisplay.LOW_RES_WIDTH; j++) {
          const idx = i * TerminalDisplay.LOW_RES_WIDTH + j;
          line += this.lowResChars[this.screen[0][idx] ? 1 : 0]
        }
        screenStr[i] = line;
      }
    }
    else if (this.screenWidth === TerminalDisplay.HIGH_RES_WIDTH && this.screenHeight === TerminalDisplay.HIGH_RES_HEIGHT) {
      screenStr = new Array<string>(this.screenHeight / 2);
      for (let i = 0; i < TerminalDisplay.HIGH_RES_HEIGHT; i += 2) {
        let line = "";
        for (let j = 0; j < TerminalDisplay.HIGH_RES_WIDTH; j += 2) {
          const idx1 = i * TerminalDisplay.HIGH_RES_WIDTH + j;
          const idx2 = idx1 + 1;
          const idx3 = idx1 + TerminalDisplay.HIGH_RES_WIDTH;
          const idx4 = idx3 + 1;
          const block =
            ((this.screen[0][idx1] || this.screen[1][idx1]) ? 1 : 0) |
            ((this.screen[0][idx2] || this.screen[1][idx2]) ? 2 : 0) |
            ((this.screen[0][idx3] || this.screen[1][idx3]) ? 4 : 0) |
            ((this.screen[0][idx4] || this.screen[1][idx4]) ? 8 : 0);
          line += this.highResChars[block];
        }
        screenStr[i / 2] = line;
      }
    }

    for (let lineIdx = 0; lineIdx < screenStr.length; lineIdx++) {
      this.screenBuffer.put({
        x: 0,
        y: lineIdx,
        attr: 255,
        wrap: false,
        dx: 1,
        dy: 0
      }, screenStr[lineIdx])
    }
    this.screenBuffer.draw();
  }
}
