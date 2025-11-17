import * as vscode from 'vscode';
import { EditorPatternId, getPatternSuggestedCommand } from '../patternRegistry';
import { EditorAction, EditorActionType, PatternMatch } from '../types';
import { BaseEditorActionPattern } from './baseEditorActionPattern';

export class WordSelectionPattern extends BaseEditorActionPattern {
    private lastSelectedText: string | null = null;
    private lastSelectionTime = 0;
    private selectionCount = 0;

    private readonly TIMEOUT_MS = 3000;
    private readonly REQUIRED_SELECTIONS = 3;

    constructor() {
        super(
            EditorPatternId.WordSelectionRepeated,
            getPatternSuggestedCommand(EditorPatternId.WordSelectionRepeated)
        );
    }

    public reset(): void {
        this.lastSelectedText = null;
        this.lastSelectionTime = 0;
        this.selectionCount = 0;
    }

    public process(action: EditorAction): PatternMatch | null {
        if (action.type !== EditorActionType.Selection) {
            return null;
        }

        const editor = vscode.window.activeTextEditor;
        if (!editor || !action.selection || action.selection.isEmpty) {
            return null;
        }

        // Check timeout
        if (this.lastSelectionTime > 0 && (action.timestamp - this.lastSelectionTime) > this.TIMEOUT_MS) {
            this.reset();
        }

        const selectedText = editor.document.getText(action.selection);

        // Must be a word
        if (!/^\w+$/.test(selectedText)) {
            this.reset();
            return null;
        }

        // Same word?
        if (selectedText === this.lastSelectedText) {
            this.selectionCount++;
            this.lastSelectionTime = action.timestamp;

            if (this.selectionCount >= this.REQUIRED_SELECTIONS) {
                this.logInfo('matched');

                const keyHint = this.getFormattedKeybinding(this.suggestedCommand);

                const match: PatternMatch = {
                    patternId: this.id,
                    suggestedCommand: this.suggestedCommand,
                    message: `You selected the same word multiple times. Try ${keyHint} for multi-cursor editing!`,
                    detectedActions: []
                };

                this.reset();
                return match;
            }
        } else {
            this.lastSelectedText = selectedText;
            this.selectionCount = 1;
            this.lastSelectionTime = action.timestamp;
        }

        return null;
    }
}
