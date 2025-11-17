/**
 * Centralized registry for all editor action patterns
 */
export enum EditorPatternId {
    LineDeleteBackspace = 'line-delete-backspace',
    WordDeleteBackspace = 'word-delete-backspace',
    LineMovementManual = 'line-movement-manual',
    LineDuplicationManual = 'line-duplication-manual',
    WordSelectionRepeated = 'word-selection-repeated',
    ArrowNavigation = 'arrow-navigation-excessive',
    TextSelectionNavigation = 'text-selection-navigation',
}

/**
 * Human-readable names for patterns
 */
export const PATTERN_FRIENDLY_NAMES: Record<EditorPatternId, string> = {
    [EditorPatternId.LineDeleteBackspace]: 'Line deletion with Backspace',
    [EditorPatternId.WordDeleteBackspace]: 'Word deletion character-by-character',
    [EditorPatternId.LineMovementManual]: 'Manual line movement',
    [EditorPatternId.LineDuplicationManual]: 'Manual line duplication',
    [EditorPatternId.WordSelectionRepeated]: 'Repeated word selection',
    [EditorPatternId.ArrowNavigation]: 'Excessive arrow key navigation',
    [EditorPatternId.TextSelectionNavigation]: 'Inefficient text selection',
};

/**
 * Suggested commands for each pattern
 */
export const PATTERN_SUGGESTED_COMMANDS: Record<EditorPatternId, string> = {
    [EditorPatternId.LineDeleteBackspace]: 'editor.action.deleteLines',
    [EditorPatternId.WordDeleteBackspace]: 'deleteWordLeft',
    [EditorPatternId.LineMovementManual]: 'editor.action.moveLinesUpAction',
    [EditorPatternId.LineDuplicationManual]: 'editor.action.copyLinesDownAction',
    [EditorPatternId.WordSelectionRepeated]: 'editor.action.addSelectionToNextFindMatch',
    [EditorPatternId.ArrowNavigation]: 'cursorHome',
    [EditorPatternId.TextSelectionNavigation]: 'cursorWordRightSelect',
};

/**
 * Commands that should reset specific patterns when executed
 */
export const PATTERN_RESET_COMMANDS: Record<EditorPatternId, string[]> = {
    [EditorPatternId.LineDeleteBackspace]: ['editor.action.deleteLines'],
    [EditorPatternId.WordDeleteBackspace]: ['deleteWordLeft', 'deleteWordRight'],
    [EditorPatternId.LineMovementManual]: [
        'editor.action.moveLinesUpAction',
        'editor.action.moveLinesDownAction'
    ],
    [EditorPatternId.LineDuplicationManual]: [
        'editor.action.copyLinesUpAction',
        'editor.action.copyLinesDownAction'
    ],
    [EditorPatternId.WordSelectionRepeated]: [
        'editor.action.addSelectionToNextFindMatch',
        'editor.action.selectHighlights'
    ],
    [EditorPatternId.ArrowNavigation]: [
        'cursorHome',
        'cursorEnd',
        'cursorWordLeft',
        'cursorWordRight',
        'cursorTop',
        'cursorBottom',
        'cursorPageUp',
        'cursorPageDown'
    ],
    [EditorPatternId.TextSelectionNavigation]: [
        'cursorWordLeftSelect',
        'cursorWordRightSelect',
        'cursorHomeSelect',
        'cursorEndSelect',
        'cursorWordStartLeftSelect',
        'cursorWordEndRightSelect',
        'expandLineSelection'
    ],
};

/**
 * Human-readable names for sub-patterns
 */
export const SUB_PATTERN_FRIENDLY_NAMES: Record<string, Record<string, string>> = {
    [EditorPatternId.ArrowNavigation]: {
        'word-traversal': 'Word-by-word arrow navigation',
        'line-traversal': 'Line start/end arrow navigation',
        'edge-bounce': 'Line edge bouncing',
        'page-scroll': 'Page scrolling with arrows',
        'file-jump': 'File navigation with arrows'
    },
    [EditorPatternId.TextSelectionNavigation]: { // NEW!
        'word-selection': 'Word selection with Shift+Arrow',
        'line-edge-selection': 'Line edge selection with Shift+Arrow',
        'general-selection': 'Slow text selection'
    }
};

/**
 * Get friendly name for sub-pattern
 */
export function getSubPatternFriendlyName(patternId: string, subPatternId: string): string {
    const subPatterns = SUB_PATTERN_FRIENDLY_NAMES[patternId as EditorPatternId];
    if (subPatterns && subPatterns[subPatternId]) {
        return subPatterns[subPatternId];
    }
    return `${getPatternFriendlyName(patternId)} (${subPatternId})`;
}

/**
 * Get friendly name for pattern ID
 */
export function getPatternFriendlyName(patternId: string): string {
    return PATTERN_FRIENDLY_NAMES[patternId as EditorPatternId] || patternId;
}

/**
 * Get suggested command for pattern ID
 */
export function getPatternSuggestedCommand(patternId: EditorPatternId): string {
    return PATTERN_SUGGESTED_COMMANDS[patternId];
}

/**
 * Get commands that should reset this pattern
 */
export function getPatternResetCommands(patternId: EditorPatternId): string[] {
    return PATTERN_RESET_COMMANDS[patternId] || [];
}

/**
 * Get all unique commands used across all patterns
 */
export function getAllUsedCommands(): string[] {
    const commands = new Set<string>();

    // Add suggested commands
    Object.values(PATTERN_SUGGESTED_COMMANDS).forEach(cmd => commands.add(cmd));

    // Add reset commands
    Object.values(PATTERN_RESET_COMMANDS).forEach(cmds => {
        cmds.forEach(cmd => commands.add(cmd));
    });

    return Array.from(commands).sort();
}

/**
 * Get commands used by a specific pattern
 */
export function getPatternCommands(patternId: EditorPatternId): string[] {
    const commands = new Set<string>();

    // Add suggested command
    commands.add(PATTERN_SUGGESTED_COMMANDS[patternId]);

    // Add reset commands
    const resetCommands = PATTERN_RESET_COMMANDS[patternId];
    if (resetCommands) {
        resetCommands.forEach(cmd => commands.add(cmd));
    }

    return Array.from(commands).sort();
}
