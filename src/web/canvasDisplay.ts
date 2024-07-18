import { Display } from "../abstract/display"

export class CanvasDisplay extends Display {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private resizeObserver: ResizeObserver

  private width: number
  private height: number

  constructor(canvas: HTMLCanvasElement) {
    super();
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
    })
    this.resizeObserver.observe(canvas)
  }

  clear() {
    // Clear the screen representation
    for (let i = 0; i < this.screen.length; i++) {
      this.screen[i].fill(false);
      this.prevScreen[i].fill(false);
    }

    this.isLayerChanged.fill(false);

    // Clear the screen
    this.ctx.fillStyle = this.layerColors.color00;
    this.ctx.fillRect(0, 0, this.width, this.height)
  }

  drawScreen(): void {
    if (!this.isLayerChanged[0] && !this.isLayerChanged[1])
      return;

    // Clear the screen
    // this.ctx.fillStyle = this.layerColors.color00;
    // this.ctx.fillRect(0, 0, this.width, this.height);

    const xStep = this.width / this.screenWidth
    const yStep = this.height / this.screenHeight

    for (let y = 0; y < this.screenHeight; y++) {
      for (let x = 0; x < this.screenWidth; x++) {
        const idx = y * this.screenWidth + x;
        if (this.prevScreen[0][idx] === this.screen[0][idx] && this.prevScreen[1][idx] === this.screen[1][idx])
          continue;
        this.ctx.fillStyle = this.getColor(x, y);
        this.ctx.fillRect(x * xStep, y * yStep, xStep, yStep)
      }
    }
    for (let layer = 0; layer < this.screen.length; layer++) {
      this.prevScreen[layer] = this.screen[layer].slice();
    }
    this.isLayerChanged.fill(false);
  }
}
