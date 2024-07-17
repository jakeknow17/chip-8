import { Display, HexColor } from "../interfaces/display.js"
import blessed from "blessed";

export class TerminalDisplay implements Display {
  static readonly LOW_RES_WIDTH = 64;
  static readonly LOW_RES_HEIGHT = 32;
  static readonly HIGH_RES_WIDTH = 128;
  static readonly HIGH_RES_HEIGHT = 64;

  static readonly NUM_LAYERS = 2;

  chars = [' ', '▘', '▝', '▀', '▖', '▌', '▞', '▛', '▗', '▚', '▐', '▜', '▄', '▙', '▟', '█']

  screen: Array<Array<Boolean>>
  prevScreen: Array<Array<Boolean>>

  screenWidth: number;
  screenHeight: number;

  activePlanes = new Array(TerminalDisplay.NUM_LAYERS).fill(false); // Bitmask from 0 to 3 inclusive
  isLayerChanged = new Array(TerminalDisplay.NUM_LAYERS).fill(false);
  // TODO: Set different layer colors
  layerColors: {
    color00: HexColor,
    color01: HexColor,
    color10: HexColor,
    color11: HexColor
  } = {
      color00: "#996600",
      color01: "#ffcc00",
      color10: "#ff6600",
      color11: "#662200",
    }

  terminal: blessed.Widgets.Screen;
  box: blessed.Widgets.BoxElement;

  constructor() {
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

    this.box.setContent(this.chars.join(''));

    this.screenWidth = TerminalDisplay.LOW_RES_WIDTH;
    this.screenHeight = TerminalDisplay.LOW_RES_HEIGHT;

    this.screen = this.createBlankScreen();
    this.prevScreen = this.createBlankScreen();

    this.terminal.render();
  }

  private createBlankScreen(): Array<Array<boolean>> {
    return Array.from({ length: TerminalDisplay.NUM_LAYERS }, () => Array(this.screenWidth * this.screenHeight).fill(false))
  }

  // private getColor(x: number, y: number): HexColor {
  //   const idx = y * this.screenWidth + x;
  //   const layer0Pixel = this.screen[0][idx];
  //   const layer1Pixel = this.screen[1][idx];
  //
  //   if (!layer0Pixel && !layer1Pixel)
  //     return this.layerColors.color00;
  //   else if (layer0Pixel && !layer1Pixel)
  //     return this.layerColors.color01;
  //   else if (!layer0Pixel && layer1Pixel)
  //     return this.layerColors.color10;
  //   else
  //     return this.layerColors.color11
  // }

  clear(): void {

  }

  drawScreen(): void {
    this.terminal.render();
  }

  drawSprite(sprite: Uint8Array, x: number, y: number, isWide?: boolean): boolean {
    console.log(sprite, x, y, isWide);
    return false;
  }

  setExtended(extended: boolean): void {
    console.log(extended);
  }

  setPlaneBitmask(plane: number): void {
    console.log(plane);
  }

  scrollDown(scrollAmt: number): void {
    console.log(scrollAmt);
  }

  scrollUp(scrollAmt: number): void {
    console.log(scrollAmt);
  }

  scrollRight(scrollAmt: number): void {
    console.log(scrollAmt);
  }

  scrollLeft(scrollAmt: number): void {
    console.log(scrollAmt);
  }
}
