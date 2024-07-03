const BYTE_SIZE = 8

import { Display, HexColor } from "../interfaces/display.js"

export class CanvasDisplay implements Display {
  static readonly LOW_RES_WIDTH = 64;
  static readonly LOW_RES_HEIGHT = 32;
  static readonly HIGH_RES_WIDTH = 128;
  static readonly HIGH_RES_HEIGHT = 64;

  private screenWidth = CanvasDisplay.LOW_RES_WIDTH;
  private screenHeight = CanvasDisplay.LOW_RES_HEIGHT;

  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  resizeObserver: ResizeObserver

  screen: Array<Array<Boolean>>

  width: number
  height: number

  offColor = "#996700"
  onColor = "#ffcc01"

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas

    // Make sure the context is valid
    const ctx = this.canvas.getContext("2d")
    if (!ctx)
      throw new Error("Unable to obtain 2D context from the canvas")
    this.ctx = ctx

    // Get canvas dimensions
    const { width, height } = canvas.getBoundingClientRect()
    this.width = width
    this.height = height

    // Watch for changes in dimensions
    this.resizeObserver = new ResizeObserver(entries => {
      for (let entry of entries) {
        this.width = entry.contentRect.width
        this.height = entry.contentRect.height
      }
      console.log("Dimensions changed", entries)
    })
    this.resizeObserver.observe(canvas)

    // Setup screen
    this.screen = this.createScreen();
    this.clear()
  }

  private createScreen(): Array<Array<boolean>> {
    return Array.from({ length: this.screenHeight }, () =>
      Array(this.screenWidth).fill(false)
    );
  }

  clear() {
    // Clear the screen representation
    for (let i = 0; i < this.screenHeight; i++) {
      this.screen[i].fill(false);
    }

    // Clear the screen
    this.ctx.fillStyle = this.offColor
    this.ctx.fillRect(0, 0, this.width, this.height)
  }

  drawPixel(set: boolean, x: number, y: number) {
    const prev = this.screen[y][x]
    this.screen[y][x] = this.screen[y][x] !== set

    const collision = prev && !this.screen[y][x]

    return collision
  }

  drawByte(byte: number, x: number, y: number) {
    let collision = false

    for (let i = 0; i < BYTE_SIZE; i++) {
      const isSet = Boolean(byte & (0x80 >> i))
      const collided = this.drawPixel(isSet, (x + i) % this.screenWidth, y);
      collision ||= collided;
    }

    return collision
  }

  drawSprite(sprite: Uint8Array, x: number, y: number, isWide = false): boolean {
    let collision = false;

    if (isWide) { // This should only ever be used with 16x16 sprites
      for (let i = 0; i < Math.floor(sprite.length / 2); i++) {
        const collided1 = this.drawByte(sprite[i], x, (y + i) % this.screenHeight);
        const collided2 = this.drawByte(sprite[i], x + 1, (y + i) % this.screenHeight);
        collision ||= collided1;
        collision ||= collided2;
      }
    }
    else {
      for (let i = 0; i < sprite.length; i++) {
        const collided = this.drawByte(sprite[i], x, (y + i) % this.screenHeight);
        collision ||= collided;
      }
    }

    return collision
  }

  drawScreen(): void {
    // Clear the screen
    this.ctx.fillStyle = this.offColor;
    this.ctx.fillRect(0, 0, this.width, this.height);

    const xStep = this.width / this.screenWidth
    const yStep = this.height / this.screenHeight

    for (let i = 0; i < this.screenHeight; i++) {
      for (let j = 0; j < this.screenWidth; j++) {
        this.ctx.fillStyle = this.screen[i][j] ? this.onColor : this.offColor;
        this.ctx.fillRect(j * xStep, i * yStep, xStep, yStep)
      }
    }
  }

  setExtended(extended: boolean): void {
    if (extended) {
      this.screenWidth = CanvasDisplay.HIGH_RES_WIDTH;
      this.screenHeight = CanvasDisplay.HIGH_RES_HEIGHT;
    }
    else {
      this.screenWidth = CanvasDisplay.LOW_RES_WIDTH;
      this.screenHeight = CanvasDisplay.LOW_RES_HEIGHT;
    }
    this.screen = this.createScreen();
  }

  setOnColor(color: HexColor): void {
    this.onColor = color;
  }

  setOffColor(color: HexColor): void {
    this.offColor = color;
  }

  scrollDown(scrollAmt: number): void {
    scrollAmt = ((scrollAmt % this.screenHeight) + this.screenHeight) % this.screenHeight;
    this.screen.splice(this.screenHeight - scrollAmt, scrollAmt);
    this.screen = [
      ...Array.from({ length: scrollAmt }, () => Array(this.screenWidth).fill(false)),
      ...this.screen,
    ];
    this.drawScreen();
  }

  scrollUp(scrollAmt: number): void {
    scrollAmt = ((scrollAmt % this.screenHeight) + this.screenHeight) % this.screenHeight;
    this.screen.splice(0, scrollAmt);
    this.screen = [
      ...this.screen,
      ...Array.from({ length: scrollAmt }, () => Array(this.screenWidth).fill(false)),
    ];
    this.drawScreen();
  }

  scrollRight(scrollAmt: number): void {
    scrollAmt = ((scrollAmt % this.screenWidth) + this.screenWidth) % this.screenWidth;
    for (let i = 0; i < this.screenHeight; i++) {
      this.screen[i].splice(this.screenWidth - scrollAmt, scrollAmt);
      this.screen[i] = [...Array(scrollAmt).fill(false), ...this.screen[i]];
    }
    this.drawScreen();
  }

  scrollLeft(scrollAmt: number): void {
    scrollAmt = ((scrollAmt % this.screenWidth) + this.screenWidth) % this.screenWidth;
    for (let i = 0; i < this.screenHeight; i++) {
      this.screen[i].splice(0, scrollAmt);
      this.screen[i] = [...this.screen[i], ...Array(scrollAmt).fill(false)];
    }
    this.drawScreen();
  }
}
