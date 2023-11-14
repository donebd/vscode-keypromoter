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

    hasKeystroke(keystroke: string[]): Boolean {
        let doubleBuffer = this.buffer.concat(this.buffer);
        let firstKeyIndex = this.nextIndex;
        let lastKeyIndex = firstKeyIndex + this.size;
        let len = keystroke.length;
        for (let i = firstKeyIndex; i <= lastKeyIndex - len; i++) {
            let window = doubleBuffer.slice(i, i + len);
            if (window.toString() === keystroke.toString()) {
                return true;
            }
        }
        return false;
    }
}
