export type HexColor = `#${string}`;

export interface Display {
  clear(): void;
  drawSprite(sprite: Uint8Array, x: number, y: number, isWide?: boolean): boolean;
  redraw(): void;
  setExtended(extended: boolean): void;
  setOnColor(color: HexColor): void;
  setOffColor(color: HexColor): void;
  scrollDown(scrollAmt: number): void;
  scrollUp(scrollAmt: number): void;
  scrollRight(scrollAmt: number): void;
  scrollLeft(scrollAmt: number): void;
}
