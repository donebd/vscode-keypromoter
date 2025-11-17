import { injectable } from 'inversify';
import { logger } from "../helper/logging";
import { PluginContext } from '../pluginContext';
import { KeyDownStack } from "./keyDownStack";
import { KeyStrokeBuffer } from "./keyStrokeBuffer";

/**
 * Detects keyboard shortcuts locally within VS Code.
 * NO DATA IS STORED OR TRANSMITTED.
 * All processing happens in-memory only.
 * 
 * Monitoring is automatically paused when VS Code loses focus for privacy.
 */
@injectable()
export abstract class KeybindingTracker {

    // Temporary in-memory buffer for last 5 keystrokes (for chord detection)
    protected keyBuf = new KeyStrokeBuffer(5);
    protected keyStack = new KeyDownStack();
    protected isListening: boolean = false;

    public abstract init(): void;

    public abstract dispose(): void;

    /**
     * Pause keyboard monitoring (called when VS Code loses focus)
     */
    public abstract pause(): void;

    /**
     * Resume keyboard monitoring (called when VS Code gains focus)
     */
    public abstract resume(): void;

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
        if (!this.isListening) {
            return;
        }
        let key = this.keyFromKeycode(keyId);
        logger.debug(`key down: ${key}`);
        this.keyBuf.keyPressed(key);
        this.keyStack.keyDown(key);
    }

    public handleKeyUp(keyId: number | string) {
        if (!this.isListening) {
            return;
        }
        let key = this.keyFromKeycode(keyId);
        logger.debug(`key up: ${key}`);
        this.keyStack.keyUp(key);
    }

    public handleMousePress() {
        if (!this.isListening) {
            return;
        }
        logger.debug(`pressed mouse`);
        this.keyBuf.reset();

        const editorTracker = PluginContext.getEditorActionTracker();
        if (editorTracker) {
            editorTracker.notifyMousePressed();
        }
    }

    public handleMouseRelease() {
        if (!this.isListening) {
            return;
        }
        logger.debug(`released mouse`);

        const editorTracker = PluginContext.getEditorActionTracker();
        if (editorTracker) {
            editorTracker.notifyMouseReleased();
        }
    }

    protected clearBuffers() {
        this.keyBuf.reset();
        this.keyStack.reset();
    }

    private splitKeys(keybinding: string) {
        return keybinding.split(/\+/);
    }
}