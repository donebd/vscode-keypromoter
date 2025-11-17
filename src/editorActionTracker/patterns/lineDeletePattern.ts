import * as vscode from 'vscode';
import { EditorPatternId, getPatternSuggestedCommand } from '../patternRegistry';
import { EditorAction, EditorActionType, PatternMatch } from '../types';
import { BaseEditorActionPattern } from './baseEditorActionPattern';
import { SequenceTracker } from './common/sequenceTracker';

interface DeletionInfo {
    timestamp: number;
    rangeLength: number;
}

export class LineDeletePattern extends BaseEditorActionPattern {
    private deletions: SequenceTracker<DeletionInfo>;
    private currentLine: number | null = null;
    private totalDeletedChars = 0;
    private initialLineText = '';

    private readonly MIN_DELETIONS_CHAR_BY_CHAR = 5;
    private readonly MIN_DELETIONS_WORD_BY_WORD = 2;

    constructor() {
        super(
            EditorPatternId.LineDeleteBackspace,
            getPatternSuggestedCommand(EditorPatternId.LineDeleteBackspace)
        );
        this.deletions = new SequenceTracker({ timeout: 2000, maxLength: 30 });
    }

    public reset(): void {
        this.logDebug(`resetting (had ${this.deletions.length} deletions)`);
        this.deletions.reset();
        this.currentLine = null;
        this.totalDeletedChars = 0;
        this.initialLineText = '';
    }

    public process(action: EditorAction): PatternMatch | null {
        if (action.type !== EditorActionType.Delete) {
            return this.checkAndReset();
        }

        const editor = vscode.window.activeTextEditor;
        if (!editor || !action.range) {
            return null;
        }

        const range = action.range;
        const startLine = range.start.line;

        // Newline deletion
        if (range.start.line !== range.end.line) {
            return this.checkAndReset();
        }

        // Line changed
        if (this.currentLine !== null && startLine !== this.currentLine) {
            const result = this.checkAndReset();
            this.currentLine = startLine;
            return result;
        }

        // Initialize tracking
        if (this.currentLine === null) {
            this.currentLine = startLine;
            this.initialLineText = editor.document.lineAt(startLine).text;
        }

        // Track deletion
        this.deletions.add({
            timestamp: action.timestamp,
            rangeLength: action.rangeLength || 0
        });

        this.totalDeletedChars += action.rangeLength || 0;

        // Check if line is now empty
        const currentLineText = editor.document.lineAt(startLine).text.trim();
        if (currentLineText.length <= 1) {
            const trimmedInitial = this.initialLineText.trim();
            if (trimmedInitial.length > 0 && this.totalDeletedChars >= trimmedInitial.length - 2) {
                return this.checkForMatch();
            }
        }

        return null;
    }

    private checkAndReset(): PatternMatch | null {
        const result = this.deletions.length > 0 ? this.checkForMatch() : null;
        this.reset();
        return result;
    }

    private checkForMatch(): PatternMatch | null {
        const trimmedInitial = this.initialLineText.trim();

        if (trimmedInitial.length === 0 || this.totalDeletedChars < trimmedInitial.length - 2) {
            return null;
        }

        // Determine method
        const isWordByWord = this.deletions.some(item => item.rangeLength > 1);

        if (isWordByWord) {
            if (this.deletions.length < this.MIN_DELETIONS_WORD_BY_WORD) {
                return null;
            }

            const firstItem = this.deletions.firstItem!;
            const lastItem = this.deletions.lastItem!;

            // Check if word delete commands were used
            if (this.wasAnyCommandExecutedInRange(
                ['deleteWordLeft', 'deleteWordRight'],
                firstItem.timestamp,
                lastItem.timestamp
            )) {
                return this.createMatch('word-by-word');
            }

            return this.createMatch('word-by-word');
        } else {
            if (this.deletions.length < this.MIN_DELETIONS_CHAR_BY_CHAR) {
                return null;
            }
            return this.createMatch('char-by-char');
        }
    }

    private createMatch(method: 'char-by-char' | 'word-by-word'): PatternMatch {
        const keyHint = this.getFormattedKeybinding(this.suggestedCommand);

        const message = method === 'word-by-word'
            ? `You deleted an entire line word-by-word. Try ${keyHint} to delete the whole line instantly!`
            : `You manually deleted an entire line with Backspace. Try ${keyHint} to delete it instantly!`;

        this.logInfo(`matched: ${this.deletions.length} deletions (${method}), ${this.totalDeletedChars} chars`);

        const match: PatternMatch = {
            patternId: this.id,
            suggestedCommand: this.suggestedCommand,
            message,
            detectedActions: []
        };

        this.reset();
        return match;
    }
}
