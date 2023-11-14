export class KeyLogBuffer {

    readonly size: number;
    private lastKey?: string;

    constructor(size: number) {
        this.size = size;
    }

    keyPressed(key: string) {
        this.lastKey = key;
    }

    wasPressed(key: string): Boolean {
        return this.lastKey === key;
    }
}