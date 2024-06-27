const BYTE_SIZE = 8

import { Display } from "../interfaces/display.js"

export class CanvasDisplay implements Display {
    static readonly SCREEN_WIDTH = 64;
    static readonly SCREEN_HEIGHT = 32;

    canvas: HTMLCanvasElement
    ctx: CanvasRenderingContext2D
    resizeObserver: ResizeObserver

    screen: Array<Boolean>

    width: number
    height: number

    clearColor = "#996700"
    solidColor = "#ffcc01"

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
        this.screen = new Array<Boolean>(CanvasDisplay.SCREEN_WIDTH * CanvasDisplay.SCREEN_WIDTH)
        this.clear()
    }

    clear() {
        // Clear the screen representation
        this.screen.fill(false)

        // Clear the screen
        this.ctx.fillStyle = this.clearColor
        this.ctx.fillRect(0, 0, this.width, this.height)
    }

    drawPixel(set: boolean, x: number, y: number) {
        const xStep = this.width / CanvasDisplay.SCREEN_WIDTH
        const yStep = this.height / CanvasDisplay.SCREEN_HEIGHT

        const index = y * CanvasDisplay.SCREEN_WIDTH + x

        const prev = this.screen[index]
        this.screen[index] = this.screen[index] !== set

        const collision = prev && !this.screen[index]

        this.ctx.fillStyle = this.screen[index] ? this.solidColor : this.clearColor;

        this.ctx.fillRect(x * xStep, y * yStep, xStep, yStep)

        return collision
    }

    drawByte(byte: number, x: number, y: number) {
        let collision = false

        for (let i = 0; i < BYTE_SIZE; i++) {
            const isSet = Boolean(byte & (0x80 >> i))
            const collided = this.drawPixel(isSet, (x + i) % CanvasDisplay.SCREEN_WIDTH, y);
            collision ||= collided;
        }

        return collision
    }

    drawSprite(sprite: Uint8Array, x: number, y: number): boolean {
        let collision = false;

        console.log(sprite, x, y);

        for (let i = 0; i < sprite.length; i++) {
            const collided = this.drawByte(sprite[i], x, (y + i) % CanvasDisplay.SCREEN_HEIGHT);
            collision ||= collided;
        }

        return collision
    }
}
