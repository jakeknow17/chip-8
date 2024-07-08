import { CanvasDisplay } from "../src/browser/canvasDisplay";
import { JSDOM } from "jsdom";

// Mock ResizeObserver
global.ResizeObserver = class {
  callback: ResizeObserverCallback
  observe() {
    this.callback(
      [{ contentRect: { width: 256, height: 128 } }] as ResizeObserverEntry[],
      this
    );
  }
  unobserve() { }
  disconnect() { }
  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
  };
}


describe('CanvasDisplay', () => {
  let canvas: HTMLCanvasElement;
  let canvasDisplay: CanvasDisplay;
  let ctx: CanvasRenderingContext2D;

  beforeEach(() => {
    const { window } = new JSDOM(`<!DOCTYPE html><canvas width="256" height="128"></canvas>`);
    canvas = window.document.querySelector('canvas') as HTMLCanvasElement;

    // Mock the 2D context with only the required methods and properties
    ctx = {
      fillRect: jest.fn(),
      fillStyle: '',
    } as unknown as CanvasRenderingContext2D;

    jest.spyOn(canvas, 'getContext').mockImplementation(() => ctx);

    canvasDisplay = new CanvasDisplay(canvas);
  });

  test('should initialize with correct default values', () => {
    expect(canvasDisplay).toBeDefined();
    expect(canvasDisplay['screenWidth']).toBe(CanvasDisplay.LOW_RES_WIDTH);
    expect(canvasDisplay['screenHeight']).toBe(CanvasDisplay.LOW_RES_HEIGHT);
    expect(canvasDisplay['activePlanes']).toEqual([true, false]);
  });

  test('should throw an error if 2D context is not obtained', () => {
    jest.spyOn(canvas, 'getContext').mockImplementation(() => null);

    expect(() => new CanvasDisplay(canvas)).toThrow("Unable to obtain 2D context from the canvas");
  });

  test('should clear the screen', () => {
    canvasDisplay.clear();
    expect(canvasDisplay['screen'].every(layer => layer.every(pixel => pixel === false))).toBeTruthy();
    expect(ctx.fillRect).toHaveBeenCalled();
    expect(ctx.fillStyle).toBe(canvasDisplay['layerColors'].color00);
  });

  test('should not change the canvas when redrawing the screen with no changes', () => {
    canvasDisplay.drawScreen();
    expect(canvasDisplay['screen'].every(layer => layer.every(pixel => pixel === false))).toBeTruthy();
    expect(ctx.fillRect).not.toHaveBeenCalled();
    expect(ctx.fillStyle).not.toBe(canvasDisplay['layerColors'].color00);
  })

  test('should set extended mode correctly', () => {
    canvasDisplay.setExtended(true);
    expect(canvasDisplay['screenWidth']).toBe(CanvasDisplay.HIGH_RES_WIDTH);
    expect(canvasDisplay['screenHeight']).toBe(CanvasDisplay.HIGH_RES_HEIGHT);
    expect(canvasDisplay['screen'][0].length).toBe(CanvasDisplay.HIGH_RES_WIDTH * CanvasDisplay.HIGH_RES_HEIGHT);
  });

  test('should correctly switch back from extended mode', () => {
    canvasDisplay.setExtended(true);
    canvasDisplay.setExtended(false);
    expect(canvasDisplay['screenWidth']).toBe(CanvasDisplay.LOW_RES_WIDTH);
    expect(canvasDisplay['screenHeight']).toBe(CanvasDisplay.LOW_RES_HEIGHT);
    expect(canvasDisplay['screen'][0].length).toBe(CanvasDisplay.LOW_RES_WIDTH * CanvasDisplay.LOW_RES_HEIGHT);
  });

  test('should scroll down correctly', () => {
    const sprite = new Uint8Array([0b10000000]);
    canvasDisplay.drawSprite(sprite, 10, 10);
    canvasDisplay.scrollDown(1);
    expect(canvasDisplay['screen'][0][(10 + 1) * CanvasDisplay.LOW_RES_WIDTH + 10]).toBe(true);
  });

  test('should scroll up correctly', () => {
    const sprite = new Uint8Array([0b10000000]);
    canvasDisplay.drawSprite(sprite, 10, 10);
    canvasDisplay.scrollUp(1);
    expect(canvasDisplay['screen'][0][(10 - 1) * CanvasDisplay.LOW_RES_WIDTH + 10]).toBe(true);
  });

  test('should scroll right correctly', () => {
    const sprite = new Uint8Array([0b10000000]);
    canvasDisplay.drawSprite(sprite, 10, 10);
    canvasDisplay.scrollRight(1);
    expect(canvasDisplay['screen'][0][10 * CanvasDisplay.LOW_RES_WIDTH + 11]).toBe(true);
  });

  test('should scroll left correctly', () => {
    const sprite = new Uint8Array([0b10000000]);
    canvasDisplay.drawSprite(sprite, 10, 10);
    canvasDisplay.scrollLeft(1);
    expect(canvasDisplay['screen'][0][10 * CanvasDisplay.LOW_RES_WIDTH + 9]).toBe(true);
  });

  test('should draw a sprite and return collision status', () => {
    const sprite = new Uint8Array([0b11110000, 0b00001111]);
    const collision = canvasDisplay.drawSprite(sprite, 10, 10);
    expect(collision).toBe(false);
    expect(canvasDisplay['screen'][0][10 * CanvasDisplay.LOW_RES_WIDTH + 10]).toBe(true);
    expect(canvasDisplay['screen'][0][10 * CanvasDisplay.LOW_RES_WIDTH + 14]).toBe(false);
    expect(canvasDisplay['screen'][0][11 * CanvasDisplay.LOW_RES_WIDTH + 10]).toBe(false);
    expect(canvasDisplay['screen'][0][11 * CanvasDisplay.LOW_RES_WIDTH + 14]).toBe(true);
  });

  test('should correctly draw overlapping sprites', () => {
    const sprite1 = new Uint8Array([0b11111111]);
    const sprite2 = new Uint8Array([0b00001111]);
    const collision1 = canvasDisplay.drawSprite(sprite1, 10, 10);
    const collision2 = canvasDisplay.drawSprite(sprite2, 10, 10);
    expect(collision1).toBe(false);
    expect(collision2).toBe(true);
    expect(canvasDisplay['screen'][0][10 * CanvasDisplay.LOW_RES_WIDTH + 10]).toBe(true);
    expect(canvasDisplay['screen'][0][10 * CanvasDisplay.LOW_RES_WIDTH + 13]).toBe(true);
    expect(canvasDisplay['screen'][0][10 * CanvasDisplay.LOW_RES_WIDTH + 14]).toBe(false);
    expect(canvasDisplay['screen'][0][10 * CanvasDisplay.LOW_RES_WIDTH + 17]).toBe(false);
  });

  test('should set the plane bitmask correctly', () => {
    canvasDisplay.setPlaneBitmask(0);
    expect(canvasDisplay['activePlanes']).toEqual([false, false]);

    canvasDisplay.setPlaneBitmask(1);
    expect(canvasDisplay['activePlanes']).toEqual([true, false]);

    canvasDisplay.setPlaneBitmask(2);
    expect(canvasDisplay['activePlanes']).toEqual([false, true]);

    canvasDisplay.setPlaneBitmask(3);
    expect(canvasDisplay['activePlanes']).toEqual([true, true]);
  });

  test('should draw a sprite in only layer 2 if the planes are switched', () => {
    const sprite = new Uint8Array([0b10000000]);
    canvasDisplay.setPlaneBitmask(2);
    const collision = canvasDisplay.drawSprite(sprite, 10, 10);
    expect(collision).toBe(false);
    expect(canvasDisplay['screen'][0][10 * CanvasDisplay.LOW_RES_WIDTH + 10]).toBe(false);
    expect(canvasDisplay['screen'][1][10 * CanvasDisplay.LOW_RES_WIDTH + 10]).toBe(true);
  });

  test('should draw a sprite in both layers when both are on', () => {
    const sprite = new Uint8Array([0b10000000]);
    canvasDisplay.setPlaneBitmask(3);
    const collision = canvasDisplay.drawSprite(sprite, 10, 10);
    expect(collision).toBe(false);
    expect(canvasDisplay['screen'][0][10 * CanvasDisplay.LOW_RES_WIDTH + 10]).toBe(true);
    expect(canvasDisplay['screen'][1][10 * CanvasDisplay.LOW_RES_WIDTH + 10]).toBe(true);
  });

  test('should draw a sprite in neither layer when both are off', () => {
    const sprite = new Uint8Array([0b10000000]);
    canvasDisplay.setPlaneBitmask(0);
    const collision = canvasDisplay.drawSprite(sprite, 10, 10);
    expect(collision).toBe(false);
    expect(canvasDisplay['screen'][0][10 * CanvasDisplay.LOW_RES_WIDTH + 10]).toBe(false);
    expect(canvasDisplay['screen'][1][10 * CanvasDisplay.LOW_RES_WIDTH + 10]).toBe(false);
  });

  test('should draw 16x16 sprites correctly', () => {
    const sprite = new Uint8Array(32);
    // Fill the sprite with a pattern
    for (let i = 0; i < sprite.length; i++) {
      sprite[i] = 0b10101010;
    }

    const collision = canvasDisplay.drawSprite(sprite, 0, 0, true);
    expect(collision).toBe(false);

    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const idx = y * canvasDisplay['screenWidth'] + x;
        const expected = (x % 2 === 0);
        expect(canvasDisplay['screen'][0][idx]).toBe(expected);
      }
    }
  });

  test('should draw the screen correctly in first plane', () => {
    const sprite = new Uint8Array([0b11110000, 0b00001111]);
    canvasDisplay.drawSprite(sprite, 10, 10);

    canvasDisplay.drawScreen();

    const xStep = canvasDisplay['width'] / canvasDisplay['screenWidth'];
    const yStep = canvasDisplay['height'] / canvasDisplay['screenHeight'];

    expect(ctx.fillRect).toHaveBeenCalledWith(10 * xStep, 10 * yStep, xStep, yStep);
    expect(ctx.fillRect).toHaveBeenCalledWith((10 + 1) * xStep, 10 * yStep, xStep, yStep);
    expect(ctx.fillRect).toHaveBeenCalledWith((10 + 2) * xStep, 10 * yStep, xStep, yStep);
    expect(ctx.fillRect).toHaveBeenCalledWith((10 + 3) * xStep, 10 * yStep, xStep, yStep);

    expect(ctx.fillRect).toHaveBeenCalledWith(14 * xStep, (10 + 1) * yStep, xStep, yStep);
    expect(ctx.fillRect).toHaveBeenCalledWith((14 + 1) * xStep, (10 + 1) * yStep, xStep, yStep);
    expect(ctx.fillRect).toHaveBeenCalledWith((14 + 2) * xStep, (10 + 1) * yStep, xStep, yStep);
    expect(ctx.fillRect).toHaveBeenCalledWith((14 + 3) * xStep, (10 + 1) * yStep, xStep, yStep);
  });
});
