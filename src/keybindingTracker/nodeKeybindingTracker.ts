import { injectable } from 'inversify';
import { GlobalKeyboardListener, IGlobalKeyEvent } from "node-global-key-listener";
import { logger } from "../helper/logging";
import { KeybindingTracker } from './keybindingTracker';
import { keyFromNodeKeyName } from "./transform";

@injectable()
export class NodeKeybindingTracker extends KeybindingTracker {

    private keyListener = new GlobalKeyboardListener();

    public init() {
        this.keyListener.addListener((event) => {
            this.fixKeyEvent(event);
            if (!event.name) {
                return;
            }
            if (event.name === "MOUSE LEFT" || event.name === "MOUSE RIGHT") {
                this.handleMousePress();
                return;
            }
            if (event.state === "DOWN") {
                this.handleKeyDown(event.name);
            } else {
                this.handleKeyUp(event.name);
            }
        });
        
        this.isListening = true;
        logger.info("NodeKeybindingTracker initialized and listening");
    }

    public pause(): void {
        if (!this.isListening) {
            return;
        }
        this.isListening = false;
        this.clearBuffers();
        logger.info("NodeKeybindingTracker paused (VS Code lost focus)");
    }

    public resume(): void {
        if (this.isListening) {
            return;
        }
        this.isListening = true;
        logger.info("NodeKeybindingTracker resumed (VS Code gained focus)");
    }

    public keyFromKeycode(keycode: string): string {
        return keyFromNodeKeyName(keycode);
    }

    public dispose() {
        logger.info("disposing NodeKeybindingTracker...");
        this.isListening = false;
        this.keyListener.kill();
        logger.info("NodeKeybindingTracker disposed!");
    }

    private fixKeyEvent(event: IGlobalKeyEvent) {
        if (event.rawKey?.name === "KPSLASH") {
            (event as any).name = "FORWARD SLASH";
        }
    }
}
