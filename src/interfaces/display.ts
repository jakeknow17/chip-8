export interface Display {
  clear(): void;
  drawSprite(sprite: Uint8Array, x: number, y: number): boolean;
}
