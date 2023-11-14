export class KeyLogBuffer {

    readonly size: number;

    constructor(size: number) {
        this.size = size;
    }

    keyPressed(key: string) {
    }

    wasPressed(key: string): Boolean {
        return true;
    }
}