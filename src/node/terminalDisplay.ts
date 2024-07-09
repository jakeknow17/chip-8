// import { Display, HexColor } from "../interfaces/display.js"
import { Display } from "../interfaces/display.js"
import blessed from "blessed";

export class TerminalDisplay implements Display {
  terminal: blessed.Widgets.Screen;

  constructor() {
    this.terminal = blessed.screen({
      smartCSR: true
    })
  }

  clear(): void {

  }

  drawScreen(): void {

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
