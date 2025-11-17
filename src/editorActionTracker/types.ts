import * as vscode from 'vscode';

export enum EditorActionType {
    Insert = 'insert',
    Delete = 'delete',
    Replace = 'replace',
    Selection = 'selection'
}

export interface EditorAction {
    type: EditorActionType;
    timestamp: number;
    document: vscode.TextDocument;

    // For text changes
    range?: vscode.Range;
    rangeOffset?: number;
    rangeLength?: number;
    text?: string;

    // For selections
    selection?: vscode.Selection;

    // Change reason (undo/redo)
    reason?: vscode.TextDocumentChangeReason;
}

export interface PatternMatch {
    patternId: string;
    subPatternId?: string;
    suggestedCommand: string;
    message: string;
    detectedActions: EditorAction[];
}

export interface EditorActionPattern {
    readonly id: string;
    readonly suggestedCommand: string;

    reset(): void;
    process(action: EditorAction): PatternMatch | null;
    isEnabled(): boolean;
}

export interface EditorState {
    lastAction?: EditorAction;
    lastSelection?: vscode.Selection;
    lastText?: string;
    actionSequence: EditorAction[];
    documentVersion: number;
}

export interface TrackerReference {
    wasCommandRecentlyExecuted: (cmd: string, withinMs?: number) => boolean;
    getLastCommandExecutionTime: (cmd: string) => number | null;
    getKeybindingsFor: (cmd: string) => string[];
}

export interface NavigationStep {
    timestamp: number;
    line: number;
    character: number;
    direction: 'left' | 'right' | 'up' | 'down' | 'unknown';
    stepSize: number;
    isWordStep: boolean;
    wasInWord?: boolean;
}

export interface SelectionStep extends NavigationStep {
    startChar: number;
    endChar: number;
}

export type Direction = 'left' | 'right' | 'up' | 'down' | 'unknown';
export type HorizontalDirection = 'left' | 'right' | 'unknown';

export interface LineEdgeInfo {
    atLineStart: boolean;
    atLineEnd: boolean;
    lineLength: number;
    lineText: string;
}
