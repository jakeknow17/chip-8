
export type HexColor = `#${string}`;

export abstract class Display {
  static readonly BYTE_SIZE = 8

  static readonly LOW_RES_WIDTH = 64;
  static readonly LOW_RES_HEIGHT = 32;
  static readonly HIGH_RES_WIDTH = 128;
  static readonly HIGH_RES_HEIGHT = 64;

  static readonly NUM_LAYERS = 2;

  protected screenWidth = Display.LOW_RES_WIDTH;
  protected screenHeight = Display.LOW_RES_HEIGHT;

  protected screen: Array<Array<Boolean>>
  protected prevScreen: Array<Array<Boolean>>

  protected activePlanes = new Array(Display.NUM_LAYERS).fill(false); // Bitmask from 0 to 3 inclusive
  protected isLayerChanged = new Array(Display.NUM_LAYERS).fill(false);
  // TODO: Set different layer colors
  protected layerColors: {
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

  constructor() {
    // Setup screen
    this.screen = this.createBlankScreen();
    this.prevScreen = this.createBlankScreen();

    this.activePlanes[0] = true;
  }

  protected createBlankScreen(): Array<Array<boolean>> {
    return Array.from({ length: Display.NUM_LAYERS }, () => Array(this.screenWidth * this.screenHeight).fill(false))
  }

  protected getColor(x: number, y: number): HexColor {
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

  abstract clear(): void;

  private drawPixel(set: boolean, x: number, y: number) {
    const idx = y * this.screenWidth + x;

    let collision = false;
    for (let plane = 0; plane < this.activePlanes.length; plane++) {
      if (!this.activePlanes[plane]) continue;
      const prev = this.screen[plane][idx];
      this.screen[plane][idx] = this.screen[plane][idx] !== set

      collision ||= prev && !this.screen[plane][idx]
    }

    return collision
  }

  private drawByte(byte: number, x: number, y: number) {
    let collision = false

    for (let i = 0; i < Display.BYTE_SIZE; i++) {
      const isSet = Boolean(byte & (0x80 >> i))
      const collided = this.drawPixel(isSet, (x + i) % this.screenWidth, y);
      collision ||= collided;
    }

    return collision
  }

  drawSprite(sprite: Uint8Array, x: number, y: number, isWide = false): boolean {

    for (let plane = 0; plane < this.activePlanes.length; plane++) {
      if (!this.activePlanes[plane]) continue;
      this.isLayerChanged[plane] = true;
    }

    let collision = false;

    if (isWide) { // This should only ever be used with 16x16 sprites
      for (let i = 0; i < sprite.length; i += 2) {
        const collided1 = this.drawByte(sprite[i], x, (y + i / 2) % this.screenHeight);
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

  abstract drawScreen(): void;

  setExtended(extended: boolean): void {
    if (extended) {
      this.screenWidth = Display.HIGH_RES_WIDTH;
      this.screenHeight = Display.HIGH_RES_HEIGHT;
    }
    else {
      this.screenWidth = Display.LOW_RES_WIDTH;
      this.screenHeight = Display.LOW_RES_HEIGHT;
    }
    this.screen = this.createBlankScreen();
  }

  setPlaneBitmask(plane: number): void {
    this.activePlanes[0] = !!(plane & 0x1);
    this.activePlanes[1] = !!(plane & 0x2);
  }

  scrollDown(scrollAmt: number): void {
    for (let layer = 0; layer < Display.NUM_LAYERS; layer++) {
      if (!this.activePlanes[layer]) continue;
      for (let i = this.screen[layer].length - 1; i >= 0; i--)
        this.screen[layer][i] = (i >= this.screenWidth * scrollAmt) ? this.screen[layer][i - (this.screenWidth * scrollAmt)] : false;
    }
  }

  scrollUp(scrollAmt: number): void {
    for (let layer = 0; layer < Display.NUM_LAYERS; layer++) {
      if (!this.activePlanes[layer]) continue;
      for (let i = 0; i < this.screen[layer].length; i++)
        this.screen[layer][i] = (i < (this.screen[layer].length - this.screenWidth * scrollAmt)) ? this.screen[layer][i + (this.screenWidth * scrollAmt)] : false;
    }
  }

  scrollRight(scrollAmt: number): void {
    for (let layer = 0; layer < Display.NUM_LAYERS; layer++) {
      if (!this.activePlanes[layer]) continue;
      for (let i = 0; i < this.screen[layer].length; i += this.screenWidth) {
        for (let j = this.screenWidth - 1; j >= 0; j--) {
          this.screen[layer][i + j] = (j > scrollAmt - 1) ? this.screen[layer][i + j - scrollAmt] : false;
        }
      }
    }
  }

  scrollLeft(scrollAmt: number): void {
    for (let layer = 0; layer < Display.NUM_LAYERS; layer++) {
      if (!this.activePlanes[layer]) continue;
      for (let i = 0; i < this.screen[layer].length; i += this.screenWidth) {
        for (let j = 0; j < this.screenWidth; j++) {
          this.screen[layer][i + j] = (j < this.screenWidth - scrollAmt) ? this.screen[layer][i + j + scrollAmt] : false;
        }
      }
    }
  }
}
