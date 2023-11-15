import { KeyLogBuffer } from "../keylogging/KeyLogBuffer";
import { KeyDownStack } from "../keylogging/KeyDownStack";
import { keyFromKeycode } from "../keylogging/transform";

export class KeyLogger {

    private keyBuf = new KeyLogBuffer(5);
    private keyStack = new KeyDownStack();

    public hasAnyKeybinding(keybindings: string[]): boolean {
        for (let keybinding of keybindings) {
            if (keybinding.includes(" ")) {
                let chords = keybinding.split(" ");
                if (this.keyBuf.hasKeystroke(this.splitKeys(chords[0])) && this.splitKeys(chords[1])) {
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

    private splitKeys(keybinding: string) {
        return keybinding.split(/\+/);
    }

    public handleKeyDown(keycode: number) {
        let key = keyFromKeycode(keycode);
        this.keyBuf.keyPressed(key);
        this.keyStack.keyDown(key);
    }

    public handleKeyUp(keycode: number) {
        this.keyStack.keyUp(keyFromKeycode(keycode));
    }

    public handleMousePress() {
        this.keyBuf.reset();
        this.keyStack.reset();
    }

}
