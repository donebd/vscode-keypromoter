import { injectable } from 'inversify';
import { logger } from "../helper/logging";
import { KeyDownStack } from "./keyDownStack";
import { KeyLogBuffer } from "./keyLogBuffer";

@injectable()
export abstract class KeyLogger {

    protected keyBuf = new KeyLogBuffer(5);
    protected keyStack = new KeyDownStack();

    public abstract init(): void;

    public abstract dispose(): void;

    public abstract keyFromKeycode(keycode: number | string): string;

    public hasAnyKeybinding(keybindings: string[]): boolean {
        for (let keybinding of keybindings) {
            if (keybinding.includes(" ")) {
                let chords = keybinding.split(" ");
                if (this.keyBuf.hasKeystroke(this.splitKeys(chords[0])) && this.splitKeys(chords[1])) {
                    this.keyBuf.reset();
                    this.keyStack.reset();
                    return true;
                }
            } else {
                if (this.keyStack.hasKeystroke(this.splitKeys(keybinding))) {
                    return true;
                }
            }
        }
        return false;
    }

    public handleKeyDown(keyId: number | string) {
        let key = this.keyFromKeycode(keyId);
        logger.debug(`key down: ${key}`);
        this.keyBuf.keyPressed(key);
        this.keyStack.keyDown(key);
    }

    public handleKeyUp(keyId: number | string) {
        let key = this.keyFromKeycode(keyId);
        logger.debug(`key up: ${key}`);
        this.keyStack.keyUp(key);
    }

    public handleMousePress() {
        logger.debug(`pressed mouse`);
        this.keyBuf.reset();
    }

    private splitKeys(keybinding: string) {
        return keybinding.split(/\+/);
    }
}
