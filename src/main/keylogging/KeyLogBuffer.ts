export class KeyLogBuffer {

    readonly size: number;

    private buffer: Array<string>;
    private nextIndex = 0;

    constructor(size: number) {
        this.size = size;
        this.buffer = new Array(size);
    }

    keyPressed(key: string) {
        this.buffer[this.nextIndex] = key;
        this.nextIndex = (this.nextIndex + 1) % this.size;
    }

    wasPressed(key: string): Boolean {
        return this.buffer.includes(key);
    }
}