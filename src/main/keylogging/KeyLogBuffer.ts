export class KeyLogBuffer {

    readonly size: number;
    private buffer: Array<string>;

    constructor(size: number) {
        this.size = size;
        this.buffer = new Array(size);
    }

    keyPressed(key: string) {
        this.buffer.push(key);
    }

    wasPressed(key: string): Boolean {
        return this.buffer.includes(key);
    }
}