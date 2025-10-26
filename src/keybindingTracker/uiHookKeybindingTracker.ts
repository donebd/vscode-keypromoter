import { injectable } from 'inversify';
import { uIOhook, UiohookKey } from 'uiohook-napi';
import { logger } from "../helper/logging";
import { KeybindingTracker } from './keybindingTracker';
import { keyFromUioHookKeycode } from "./transform";

@injectable()
export class UiHookKeybindingTracker extends KeybindingTracker {

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
        
        this.isListening = true;
        logger.info("UiHookKeybindingTracker initialized and listening");
    }

    public pause(): void {
        if (!this.isListening) {
            return;
        }
        this.isListening = false;
        this.clearBuffers();
        logger.info("UiHookKeybindingTracker paused (VS Code lost focus)");
    }

    public resume(): void {
        if (this.isListening) {
            return;
        }
        this.isListening = true;
        logger.info("UiHookKeybindingTracker resumed (VS Code gained focus)");
    }

    public keyFromKeycode(keycode: number): string {
        return keyFromUioHookKeycode(keycode);
    }

    public dispose() {
        logger.info("disposing UiHookKeybindingTracker...");
        this.isListening = false;
        uIOhook.stop();
        logger.info("UiHookKeybindingTracker disposed!");
    }
}
