import { injectable } from 'inversify';
import { uIOhook } from 'uiohook-napi';
import { logger } from "../helper/logging";
import { KeyLogger } from './keyLogger';
import { keyFromUioHookKeycode } from "./transform";

@injectable()
export class UiHookKeyLogger extends KeyLogger {

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

    public keyFromKeycode(keycode: number): string {
        return keyFromUioHookKeycode(keycode);
    }

    public dispose() {
        logger.info("deactivating extension...");
        uIOhook.stop();
        logger.info("extension deactivated!");
    }

}
