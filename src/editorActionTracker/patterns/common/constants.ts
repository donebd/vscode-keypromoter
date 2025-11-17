export const DEFAULT_TIMEOUT_MS = 3000;
export const DEFAULT_MAX_STEP_INTERVAL = 1000;
export const FAST_ACTION_THRESHOLD_MS = 150;

export const WORD_BOUNDARY_CHARS = new Set([
    '.', ',', '(', ')', '[', ']', '{', '}', ' ', '\t',
    ';', ':', '"', "'", '<', '>', '/', '\\', '|',
    '!', '?', '@', '#', '$', '%', '^', '&', '*',
    '+', '=', '-', '~', '`'
]);

export const EDIT_COMMANDS = [
    'deleteLeft', 'deleteRight',
    'deleteWordLeft', 'deleteWordRight',
    'type', 'paste', 'cut',
    'tab', 'outdent',
    'editor.action.insertLineAfter',
    'editor.action.insertLineBefore'
];

export const WORD_SELECTION_COMMANDS = [
    'cursorWordLeftSelect',
    'cursorWordRightSelect',
    'cursorWordStartLeftSelect',
    'cursorWordEndRightSelect'
];

export const INSTANT_NAVIGATION_COMMANDS = [
    'cursorHome', 'cursorEnd',
    'cursorTop', 'cursorBottom',
    'cursorPageUp', 'cursorPageDown'
];

export const INSTANT_SELECTION_COMMANDS = [
    'cursorHomeSelect',
    'cursorEndSelect',
    'expandLineSelection',
    'editor.action.selectAll',
    'editor.action.smartSelect.expand'
];
