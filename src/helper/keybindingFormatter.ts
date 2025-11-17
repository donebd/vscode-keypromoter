/**
 * Utility for formatting keybindings for human-readable display
 */
export class KeybindingFormatter {
    private static readonly SPECIAL_KEYS: Record<string, string> = {
        'ctrl': 'Ctrl',
        'shift': 'Shift',
        'alt': 'Alt',
        'meta': 'Cmd',
        'cmd': 'Cmd',
        'enter': 'Enter',
        'escape': 'Esc',
        'backspace': 'Backspace',
        'delete': 'Delete',
        'tab': 'Tab',
        'space': 'Space',
        'pageup': 'PageUp',
        'pagedown': 'PageDown',
        'home': 'Home',
        'end': 'End',
        'insert': 'Insert',
        'up': '↑',
        'down': '↓',
        'left': '←',
        'right': '→',
        'f1': 'F1',
        'f2': 'F2',
        'f3': 'F3',
        'f4': 'F4',
        'f5': 'F5',
        'f6': 'F6',
        'f7': 'F7',
        'f8': 'F8',
        'f9': 'F9',
        'f10': 'F10',
        'f11': 'F11',
        'f12': 'F12',
    };

    /**
     * Format a keybinding string for human-readable display
     * @param keybinding - Raw keybinding string (e.g., "ctrl+shift+k")
     * @returns Formatted string (e.g., "Ctrl+Shift+K") or fallback message if null
     * 
     * @example
     * formatKeybinding("ctrl+shift+k") // Returns: "Ctrl+Shift+K"
     * formatKeybinding("cmd+d") // Returns: "Cmd+D"
     * formatKeybinding(null) // Returns: "the keyboard shortcut"
     */
    public static format(keybinding: string | null): string {
        if (!keybinding) {
            return 'the keyboard shortcut';
        }

        return keybinding
            .split('+')
            .map(key => this.formatKey(key))
            .join('+');
    }

    /**
     * Format multiple keybindings, returning the first one or a fallback
     * @param keybindings - Array of keybinding strings
     * @returns Formatted first keybinding or fallback message
     * 
     * @example
     * formatFirst(["ctrl+k", "cmd+k"]) // Returns: "Ctrl+K"
     * formatFirst([]) // Returns: "the keyboard shortcut"
     */
    public static formatFirst(keybindings: string[]): string {
        if (keybindings.length === 0) {
            return 'the keyboard shortcut';
        }
        return this.format(keybindings[0]);
    }

    /**
     * Format all keybindings in an array
     * @param keybindings - Array of keybinding strings
     * @returns Array of formatted strings
     * 
     * @example
     * formatAll(["ctrl+k", "cmd+k"]) // Returns: ["Ctrl+K", "Cmd+K"]
     */
    public static formatAll(keybindings: string[]): string[] {
        return keybindings.map(kb => this.format(kb));
    }

    /**
     * Format a single key according to display rules
     * @param key - Raw key string
     * @returns Formatted key string
     */
    private static formatKey(key: string): string {
        const lowerKey = key.toLowerCase().trim();

        // Check if it's a special key
        if (this.SPECIAL_KEYS[lowerKey]) {
            return this.SPECIAL_KEYS[lowerKey];
        }

        // For regular characters, uppercase them
        return key.toUpperCase();
    }
}
