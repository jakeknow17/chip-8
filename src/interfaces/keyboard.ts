export interface Keyboard {
  isPressed(key: number): boolean;
  clearWait(): void;
  startWait(): void;
  getWaitKey(): number | null;
  clearWaitKey(): void;
}
