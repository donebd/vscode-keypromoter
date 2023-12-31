import { uIOhook } from 'uiohook-napi';
import { logger } from "../helper/logging";
import { KeyDownStack } from "./keyDownStack";
import { KeyLogBuffer } from "./keyLogBuffer";
import { keyFromKeycode } from "./transform";

export class KeyLogger {

    private keyBuf = new KeyLogBuffer(5);
    private keyStack = new KeyDownStack();

    public init() {
        uIOhook.on('keydown', (e) => {
            this.handleKeyDown(e.keycode);
        });
        uIOhook.on('keyup', (e) => {
            this.handleKeyUp(e.keycode);
        });
        uIOhook.on('mousedown', (_) => {
            this.handleMousePress();
        });
        uIOhook.start();
    }

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

    private splitKeys(keybinding: string) {
        return keybinding.split(/\+/);
    }

    public handleKeyDown(keycode: number) {
        let key = keyFromKeycode(keycode);
        logger.debug(`key down: ${key}`);
        this.keyBuf.keyPressed(key);
        this.keyStack.keyDown(key);
    }

    public handleKeyUp(keycode: number) {
        let key = keyFromKeycode(keycode);
        logger.debug(`key up: ${key}`);
        this.keyStack.keyUp(key);
    }

    public handleMousePress() {
        logger.debug(`pressed mouse`);
        this.keyBuf.reset();
    }

    public dispose() {
        logger.info("deactivating extension...");
        uIOhook.stop();
        logger.info("extension deactivated!");
    }

}
