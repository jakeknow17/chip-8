export type HexColor = `#${string}`;

export interface Display {
  clear(): void;
  drawScreen(): void;
  drawSprite(sprite: Uint8Array, x: number, y: number, isWide?: boolean): boolean;
  setExtended(extended: boolean): void;
  setPlaneBitmask(plane: number): void;
  scrollDown(scrollAmt: number): void;
  scrollUp(scrollAmt: number): void;
  scrollRight(scrollAmt: number): void;
  scrollLeft(scrollAmt: number): void;
}
