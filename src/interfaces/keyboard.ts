export interface Keyboard {
  isPressed(key: number): boolean;
  waitKey(): Promise<number>;
  clearWait(): boolean;
}
