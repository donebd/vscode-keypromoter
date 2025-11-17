import { logger } from "./helper/logging";
import { KeybindingTracker } from "./keybindingTracker/keybindingTracker";
import { EditorActionTracker } from "./editorActionTracker/editorActionTracker";

/**
 * Centralized context for plugin state management.
 */
export class PluginContext {

    private static keybindingTracker: KeybindingTracker | undefined;
    private static editorActionTracker: EditorActionTracker | undefined;

    /**
     * Initialize or update the keybinding tracker instance
     */
    public static setKeybindingTracker(tracker: KeybindingTracker | undefined): void {
        if (this.keybindingTracker && tracker !== this.keybindingTracker) {
            logger.info("disposing previous keybinding tracker instance");
            this.keybindingTracker.dispose();
        }
        this.keybindingTracker = tracker;
    }

    /**
     * Initialize or update the editor action tracker instance
     */
    public static setEditorActionTracker(tracker: EditorActionTracker | undefined): void {
        if (this.editorActionTracker && tracker !== this.editorActionTracker) {
            logger.info("disposing previous editor action tracker instance");
            this.editorActionTracker.dispose();
        }
        this.editorActionTracker = tracker;
    }

    public static getKeybindingTracker(): KeybindingTracker | undefined {
        return this.keybindingTracker;
    }

    public static getEditorActionTracker(): EditorActionTracker | undefined {
        return this.editorActionTracker;
    }

    public static hasKeybindingTracker(): boolean {
        return this.keybindingTracker !== undefined;
    }

    public static hasEditorActionTracker(): boolean {
        return this.editorActionTracker !== undefined;
    }

    /**
     * Pause keyboard monitoring (when VS Code loses focus)
     */
    public static pause(): void {
        if (this.keybindingTracker) {
            this.keybindingTracker.pause();
        }
        if (this.editorActionTracker) {
            this.editorActionTracker.stop();
        }
    }

    /**
     * Resume keyboard monitoring (when VS Code gains focus)
     */
    public static resume(): void {
        if (this.keybindingTracker) {
            this.keybindingTracker.resume();
        }
        if (this.editorActionTracker) {
            this.editorActionTracker.resume();
        }
    }

    public static dispose(): void {
        if (this.keybindingTracker) {
            logger.info("disposing keybinding tracker from PluginContext");
            this.keybindingTracker.dispose();
            this.keybindingTracker = undefined;
        }
        if (this.editorActionTracker) {
            logger.info("disposing editor action tracker from PluginContext");
            this.editorActionTracker.dispose();
            this.editorActionTracker = undefined;
        }
    }

}
