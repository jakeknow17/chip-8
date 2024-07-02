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

    screen: Array<Boolean>

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
        this.screen = new Array<Boolean>(this.screenWidth * this.screenWidth)
        this.clear()
    }

    clear() {
        // Clear the screen representation
        this.screen.fill(false)

        // Clear the screen
        this.ctx.fillStyle = this.offColor
        this.ctx.fillRect(0, 0, this.width, this.height)
    }

    drawPixel(set: boolean, x: number, y: number) {
        const xStep = this.width / this.screenWidth
        const yStep = this.height / this.screenHeight

        const index = y * this.screenWidth + x

        const prev = this.screen[index]
        this.screen[index] = this.screen[index] !== set

        const collision = prev && !this.screen[index]

        this.ctx.fillStyle = this.screen[index] ? this.onColor : this.offColor;

        this.ctx.fillRect(x * xStep, y * yStep, xStep, yStep)

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

    redraw(): void {
        // Clear the screen
        this.ctx.fillStyle = this.offColor;
        this.ctx.fillRect(0, 0, this.width, this.height);

        for (let i = 0; i < this.screenWidth; i++) {
            for (let j = 0; j < this.screenHeight; j++) {
                const xStep = this.width / this.screenWidth
                const yStep = this.height / this.screenHeight
                const index = i * this.screenWidth + j

                this.ctx.fillStyle = this.screen[index] ? this.onColor : this.offColor;
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
    }

    setOnColor(color: HexColor): void {
        this.onColor = color;
    }

    setOffColor(color: HexColor): void {
        this.offColor = color;
    }
}
