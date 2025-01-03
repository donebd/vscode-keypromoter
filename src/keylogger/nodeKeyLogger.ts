import { injectable } from 'inversify';
import { GlobalKeyboardListener, IGlobalKeyEvent } from "node-global-key-listener";
import { logger } from "../helper/logging";
import { KeyLogger } from './keyLogger';
import { keyFromNodeKeyName } from "./transform";

@injectable()
export class NodeKeyLogger extends KeyLogger {

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
    }

    public keyFromKeycode(keycode: string): string {
        return keyFromNodeKeyName(keycode);
    }

    public dispose() {
        logger.info("deactivating extension...");
        this.keyListener.kill();
        logger.info("extension deactivated!");
    }

    private fixKeyEvent(event: IGlobalKeyEvent) {
        if (event.rawKey?.name === "KPSLASH") {
            (event as any).name = "FORWARD SLASH";
        }
    }

}
