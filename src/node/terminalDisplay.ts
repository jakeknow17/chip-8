import { Display } from "../abstract/display.js"

export class TerminalDisplay extends Display {
  lowResChars = [' ', '█']
  highResChars = [' ', '▘', '▝', '▀', '▖', '▌', '▞', '▛', '▗', '▚', '▐', '▜', '▄', '▙', '▟', '█']

  constructor() {
    super();
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

    let screenStr = "";
    if (this.screenWidth === TerminalDisplay.LOW_RES_WIDTH && this.screenHeight === TerminalDisplay.LOW_RES_HEIGHT) {
      for (let i = 0; i < TerminalDisplay.LOW_RES_HEIGHT; i++) {
        for (let j = 0; j < TerminalDisplay.LOW_RES_WIDTH; j++) {
          const idx = i * TerminalDisplay.LOW_RES_WIDTH + j;
          screenStr += this.lowResChars[this.screen[0][idx] ? 1 : 0]
        }
        screenStr += '\n'
      }
    }
    else if (this.screenWidth === TerminalDisplay.HIGH_RES_WIDTH && this.screenHeight === TerminalDisplay.HIGH_RES_HEIGHT) {
      for (let i = 0; i < TerminalDisplay.HIGH_RES_HEIGHT; i += 2) {
        for (let j = 0; j < TerminalDisplay.HIGH_RES_WIDTH; j += 2) {
          const idx1 = i * TerminalDisplay.HIGH_RES_WIDTH + j;
          const idx2 = idx1 + 1;
          const idx3 = idx1 + TerminalDisplay.HIGH_RES_WIDTH;
          const idx4 = idx3 + 1;
          const block =
            (this.screen[0][idx1] ? 1 : 0) |
            (this.screen[0][idx2] ? 2 : 0) |
            (this.screen[0][idx3] ? 4 : 0) |
            (this.screen[0][idx4] ? 8 : 0);
          screenStr += this.highResChars[block];
        }
        screenStr += '\n';
      }
    }
  }
}
