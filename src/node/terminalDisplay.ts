import { Display } from "../abstract/display.js"
import blessed from "blessed";

export class TerminalDisplay extends Display {
  lowResChars = [' ', '█']
  highResChars = [' ', '▘', '▝', '▀', '▖', '▌', '▞', '▛', '▗', '▚', '▐', '▜', '▄', '▙', '▟', '█']

  terminal: blessed.Widgets.Screen;
  box: blessed.Widgets.BoxElement;

  constructor() {
    super();
    this.terminal = blessed.screen({
      smartCSR: true,
      title: "XO-Chip",
      width: TerminalDisplay.LOW_RES_WIDTH / 4,
      height: TerminalDisplay.LOW_RES_HEIGHT / 4,
    });

    this.box = blessed.box({
      top: 'center',
      left: 'center',
      width: '66%',
      height: '66%',
      content: '',
      tags: true,
      border: {
        type: 'line'
      },
      style: {
        fg: 'white',
        bg: 'black',
        border: {
          fg: '#f0f0f0'
        },
        hover: {
          bg: 'green'
        }
      }
    })

    this.terminal.append(this.box);

    this.terminal.key('C-c', () => {
      return process.exit(0);
    })

    this.screenWidth = TerminalDisplay.LOW_RES_WIDTH;
    this.screenHeight = TerminalDisplay.LOW_RES_HEIGHT;

    this.screen = this.createBlankScreen();
    this.prevScreen = this.createBlankScreen();

    this.terminal.render();
  }

  clear(): void {

  }

  drawScreen(): void {
    this.terminal.render();
  }
}
