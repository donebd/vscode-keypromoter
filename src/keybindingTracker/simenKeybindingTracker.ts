import { injectable } from 'inversify';
import { logger } from "../helper/logging";
import { KeybindingTracker } from './keybindingTracker';
import { keyFromSimenKeyName, UNSUPPORTED_KEY } from "./transform";
import * as vscode from 'vscode';
import { getGlobalKeyboardListener, checkKeyboardPermission, IGlobalKeyEvent, IGlobalKeyboardListener } from 'simen-keyboard-listener';

@injectable()
export class SimenKeybindingTracker extends KeybindingTracker {
    private listener: IGlobalKeyboardListener | undefined;
    private handler: ((event: IGlobalKeyEvent, _isDown: any) => void) | undefined;

    public init() {
        try {
            this.listener = getGlobalKeyboardListener();
            this.handler = (event: IGlobalKeyEvent, _isDown: any) => {
                const keyName = keyFromSimenKeyName(event.name);

                if (keyName === UNSUPPORTED_KEY) {
                    return;
                }

                if (event.state === 'DOWN') {
                    this.handleKeyDown(keyName);
                }

                if (event.state === 'UP') {
                    this.handleKeyUp(keyName);
                }

                if ((event.state as any) === 'PERMISSION_LOST') {
                    logger.warn("SimenKeybindingTracker: Input Monitoring permission lost");
                    this.showPermissionWarning();
                }
            };
            this.listener.addListener(this.handler);

            if (!checkKeyboardPermission()) {
                this.showPermissionWarning();
            }

            logger.info("SimenKeybindingTracker initialized and listening");
            this.isListening = true;

        } catch (e) {
            logger.error(`SimenKeybindingTracker failed to start: ${e}`);
        }
    }

    private showPermissionWarning() {
        if (process.platform !== 'darwin') {
            return;
        }
        vscode.window.showInformationMessage(
            "Key Promoter requires 'Input Monitoring' permission on macOS to detect shortcuts.",
            "Open Settings",
            "Don't Show Again"
        ).then(selection => {
            if (selection === "Open Settings") {
                vscode.env.openExternal(vscode.Uri.parse('x-apple.systempreferences:com.apple.preference.security?Privacy_ListenEvent'));
            }
        });
    }

    public pause(): void {
        if (!this.isListening) return;
        this.isListening = false;
        this.clearBuffers();
        logger.info("SimenKeybindingTracker paused");
    }

    public resume(): void {
        if (this.isListening) return;
        this.isListening = true;
        logger.info("SimenKeybindingTracker resumed");
    }

    public keyFromKeycode(keycode: number | string): string {
        if (typeof keycode === 'string') {
            return keycode;
        }
        return UNSUPPORTED_KEY;
    }

    public dispose() {
        logger.info("disposing SimenKeybindingTracker...");
        this.isListening = false;
        if (this.listener) {
            this.listener?.removeListener(this.handler!);
        }
        logger.info("SimenKeybindingTracker disposed!");
    }
}
