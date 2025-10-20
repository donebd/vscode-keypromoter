import { logger } from "./helper/logging";
import { KeybindingTracker } from "./keybindingTracker/keybindingTracker";

/**
 * Centralized context for plugin state management.
 */
export class PluginContext {

    private static keybindingTracker: KeybindingTracker | undefined;

    /**
     * Initialize or update the keybinding tracker instance
     */
    public static setKeybindingTracker(tracker: KeybindingTracker | undefined): void {
        // Dispose previous instance if exists
        if (this.keybindingTracker && tracker !== this.keybindingTracker) {
            logger.info("disposing previous keybinding tracker instance");
            this.keybindingTracker.dispose();
        }
        this.keybindingTracker = tracker;
    }

    public static getKeybindingTracker(): KeybindingTracker | undefined {
        return this.keybindingTracker;
    }

    public static hasKeybindingTracker(): boolean {
        return this.keybindingTracker !== undefined;
    }

    /**
     * Pause keyboard monitoring (when VS Code loses focus)
     */
    public static pause(): void {
        if (this.keybindingTracker) {
            this.keybindingTracker.pause();
        }
    }

    /**
     * Resume keyboard monitoring (when VS Code gains focus)
     */
    public static resume(): void {
        if (this.keybindingTracker) {
            this.keybindingTracker.resume();
        }
    }

    public static dispose(): void {
        if (this.keybindingTracker) {
            logger.info("disposing keybinding tracker from PluginContext");
            this.keybindingTracker.dispose();
            this.keybindingTracker = undefined;
        }
    }

}
