const BYTE_SIZE = 8

import { Display, HexColor } from "../interfaces/display.js"

export class CanvasDisplay implements Display {
  static readonly LOW_RES_WIDTH = 64;
  static readonly LOW_RES_HEIGHT = 32;
  static readonly HIGH_RES_WIDTH = 128;
  static readonly HIGH_RES_HEIGHT = 64;

  static readonly NUM_LAYERS = 2;

  private screenWidth = CanvasDisplay.LOW_RES_WIDTH;
  private screenHeight = CanvasDisplay.LOW_RES_HEIGHT;

  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private resizeObserver: ResizeObserver

  private screen: Array<Array<Boolean>>

  private width: number
  private height: number

  private activeLayer = 0;
  private isLayerDirty = new Array(CanvasDisplay.NUM_LAYERS).fill(false);
  // TODO: Set different layer colors
  private layerColors: {
    color00: HexColor,
    color01: HexColor,
    color10: HexColor,
    color11: HexColor
  } = {
      color00: "#996700",
      color01: "#ffcc01",
      color10: "#996700",
      color11: "#ffcc01",
    }

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
    this.screen = this.createBlankScreen();
    this.clear()
  }

  private createBlankScreen(): Array<Array<boolean>> {
    return Array.from({ length: CanvasDisplay.NUM_LAYERS }, () => Array(this.screenWidth * this.screenHeight).fill(false))
  }

  private getColor(x: number, y: number): HexColor {
    const idx = y * this.screenWidth + x;
    const layer0Pixel = this.screen[0][idx];
    const layer1Pixel = this.screen[1][idx];

    if (!layer0Pixel && !layer1Pixel)
      return this.layerColors.color00;
    else if (layer0Pixel && !layer1Pixel)
      return this.layerColors.color01;
    else if (!layer0Pixel && layer1Pixel)
      return this.layerColors.color10;
    else
      return this.layerColors.color11
  }

  clear() {
    // Clear the screen representation
    for (let i = 0; i < this.screen.length; i++) {
      this.screen[i].fill(false);
    }

    this.isLayerDirty.fill(false);

    // Clear the screen
    this.ctx.fillStyle = this.layerColors.color00;
    this.ctx.fillRect(0, 0, this.width, this.height)
  }

  drawPixel(set: boolean, x: number, y: number) {
    const idx = y * this.screenWidth + x;
    const prev = this.screen[this.activeLayer][idx];
    this.screen[this.activeLayer][idx] = this.screen[this.activeLayer][idx] !== set

    const collision = prev && !this.screen[this.activeLayer][idx]

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
    this.isLayerDirty[this.activeLayer] = true;

    let collision = false;

    if (isWide) { // This should only ever be used with 16x16 sprites
      for (let i = 0; i < sprite.length; i += 2) {
        const collided1 = this.drawByte(sprite[i],     x,     (y + i / 2) % this.screenHeight);
        const collided2 = this.drawByte(sprite[i + 1], x + 8, (y + i / 2) % this.screenHeight);
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
    this.ctx.fillStyle = this.layerColors.color00;
    this.ctx.fillRect(0, 0, this.width, this.height);

    const xStep = this.width / this.screenWidth
    const yStep = this.height / this.screenHeight

    for (let y = 0; y < this.screenHeight; y++) {
      for (let x = 0; x < this.screenWidth; x++) {
        this.ctx.fillStyle = this.getColor(x, y);
        this.ctx.fillRect(x * xStep, y * yStep, xStep, yStep)
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
    this.screen = this.createBlankScreen();
  }

  scrollDown(scrollAmt: number): void {
    for (let layer = 0; layer < CanvasDisplay.NUM_LAYERS; layer++) {
      if (!this.isLayerDirty[layer]) continue;
      for (let i = this.screen[layer].length - 1; i >= 0; i--)
        this.screen[layer][i] = (i >= this.screenWidth * scrollAmt) ? this.screen[layer][i - (this.screenWidth * scrollAmt)] : false;
    }
  }

  scrollUp(scrollAmt: number): void {
    for (let layer = 0; layer < CanvasDisplay.NUM_LAYERS; layer++) {
      if (!this.isLayerDirty[layer]) continue;
      for (let i = 0; i < this.screen[layer].length; i++)
        this.screen[layer][i] = (i < (this.screen[layer].length - this.screenWidth * scrollAmt)) ? this.screen[layer][i + (this.screenWidth * scrollAmt)] : false;
    }
  }

  scrollRight(scrollAmt: number): void {
    for (let layer = 0; layer < CanvasDisplay.NUM_LAYERS; layer++) {
      if (!this.isLayerDirty[layer]) continue;
      for (let i = 0; i < this.screen[layer].length; i += this.screenWidth) {
        for (let j = this.screenWidth - 1; j >= 0; j--) {
          this.screen[layer][i + j] = (j > scrollAmt - 1) ? this.screen[layer][i + j - scrollAmt] : false;
        }
      }
    }
  }

  scrollLeft(scrollAmt: number): void {
    for (let layer = 0; layer < CanvasDisplay.NUM_LAYERS; layer++) {
      if (!this.isLayerDirty[layer]) continue;
      for (let i = 0; i < this.screen[layer].length; i += this.screenWidth) {
        for (let j = 0; j < this.screenWidth; j++) {
          this.screen[layer][i + j] = (j < this.screenWidth - scrollAmt) ? this.screen[layer][i + j + scrollAmt] : false;
        }
      }
    }
  }
}
