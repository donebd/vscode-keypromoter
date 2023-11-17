export class KeyDownStack {

    private stack: Array<string>;

    public constructor() {
        this.stack = new Array();
    }

    public keyDown(key: string) {
        if (this.stack.find(it => it === key)) {
            return;
        }
        this.stack.push(key);
    }

    public keyUp(key: string) {
        this.stack = this.stack.filter(other => other !== key);
    }

    public hasKeystroke(keystroke: string[]) {
        return this.stack.toString() === keystroke.toString();
    }

    public reset() {
        this.stack = new Array();
    }

}
