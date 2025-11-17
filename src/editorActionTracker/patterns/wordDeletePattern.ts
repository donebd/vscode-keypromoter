import * as vscode from 'vscode';
import { EditorPatternId, getPatternSuggestedCommand } from '../patternRegistry';
import { EditorAction, EditorActionType, PatternMatch } from '../types';
import { BaseEditorActionPattern } from './baseEditorActionPattern';
import { PatternUtils } from './common/patternUtils';
import { SequenceTracker } from './common/sequenceTracker';

interface DeletionStep {
    timestamp: number;
    line: number;
    character: number;
    rangeLength: number;
}

export class WordDeletePattern extends BaseEditorActionPattern {
    private deletions: SequenceTracker<DeletionStep>;
    private deletionDirection: 'left' | 'right' | null = null;
    private currentSegmentDeletes = 0;

    private readonly MIN_SEGMENT_LENGTH = 3;
    private readonly MIN_TOTAL_DELETIONS = 4;

    constructor() {
        super(
            EditorPatternId.WordDeleteBackspace,
            getPatternSuggestedCommand(EditorPatternId.WordDeleteBackspace)
        );
        this.deletions = new SequenceTracker({ timeout: 1500, maxLength: 30 });
    }

    public reset(): void {
        this.logDebug(`resetting (had ${this.deletions.length} deletions, direction=${this.deletionDirection})`);
        this.deletions.reset();
        this.deletionDirection = null;
        this.currentSegmentDeletes = 0;
    }

    public process(action: EditorAction): PatternMatch | null {
        if (action.type !== EditorActionType.Delete) {
            return this.checkAndReset('non-delete action');
        }

        const editor = vscode.window.activeTextEditor;
        if (!editor || !action.range) {
            return null;
        }

        const range = action.range;

        // Multi-line deletion
        if (range.start.line !== range.end.line) {
            return this.checkAndReset('multi-line deletion');
        }

        // Line changed
        const lastItem = this.deletions.lastItem;
        if (lastItem && range.start.line !== lastItem.line) {
            return this.checkAndReset('line changed');
        }

        // Determine direction
        const currentDirection = this.determineDirection(range);

        this.logDebug(
            `Processing deletion at char=${range.start.character}, ` +
            `lastItem=${lastItem ? lastItem.character : 'none'}, ` +
            `currentDir=${currentDirection}, ` +
            `storedDir=${this.deletionDirection}, ` +
            `deletions=${this.deletions.length}`
        );

        // Direction changed - just reset without checking
        if (this.deletionDirection && currentDirection && this.deletionDirection !== currentDirection) {
            this.logDebug(
                `checking (reason: direction changed, total: ${this.deletions.length}, ` +
                `segment: ${this.currentSegmentDeletes}, dir: ${this.deletionDirection})`
            );
            this.reset();
            this.deletionDirection = currentDirection;
        }

        // Set direction if not set and we now know it
        if (!this.deletionDirection && currentDirection) {
            this.deletionDirection = currentDirection;
        }

        // Check continuity ONLY if we have established direction
        if (this.deletions.lastItem && this.deletionDirection) {
            const lastItemAfterPotentialReset = this.deletions.lastItem;
            const expectedChar = this.deletionDirection === 'left'
                ? lastItemAfterPotentialReset.character - 1
                : lastItemAfterPotentialReset.character;

            if (range.start.character !== expectedChar) {
                this.reset();
                if (currentDirection) {
                    this.deletionDirection = currentDirection;
                }
            }
        }

        // Track deletion
        this.deletions.add({
            timestamp: action.timestamp,
            line: range.start.line,
            character: range.start.character,
            rangeLength: action.rangeLength || 0
        });

        this.currentSegmentDeletes++;

        // Check for word boundary (only if we know direction)
        if (this.deletionDirection) {
            const atBoundary = this.checkWordBoundary(editor, range, this.deletionDirection);

            if (atBoundary) {
                this.logDebug(`at boundary, segment=${this.currentSegmentDeletes}`);

                if (this.currentSegmentDeletes >= this.MIN_SEGMENT_LENGTH &&
                    this.deletions.length >= this.MIN_TOTAL_DELETIONS) {
                    const result = this.checkForMatch('boundary reached');
                    if (result) {
                        return result;
                    }
                }

                this.currentSegmentDeletes = 0;
            }
        }

        return null;
    }

    private determineDirection(range: vscode.Range): 'left' | 'right' | null {
        const lastItem = this.deletions.lastItem;
        if (!lastItem) {
            return null; // Don't know yet for first deletion
        }

        // If cursor position stayed the same -> Delete key (right)
        // If cursor position moved left -> Backspace (left)
        return range.start.character >= lastItem.character ? 'right' : 'left';
    }

    private checkWordBoundary(
        editor: vscode.TextEditor,
        range: vscode.Range,
        direction: 'left' | 'right'
    ): boolean {
        try {
            const line = editor.document.lineAt(range.start.line);

            if (direction === 'left') {
                if (range.start.character === 0) {
                    return true;
                }
                if (range.start.character > 0) {
                    const char = line.text[range.start.character - 1];
                    return PatternUtils.isWordBoundary(char);
                }
            } else {
                if (range.start.character >= line.text.length) {
                    return true;
                }
                const char = line.text[range.start.character];
                return PatternUtils.isWordBoundary(char);
            }
        } catch {
            return false;
        }

        return false;
    }

    private checkAndReset(reason: string): PatternMatch | null {
        if (this.deletions.length > 0) {
            const result = this.checkForMatch(reason);
            this.reset();
            return result;
        }
        this.reset();
        return null;
    }

    private checkForMatch(reason: string): PatternMatch | null {
        this.logDebug(
            `checking (reason: ${reason}, total: ${this.deletions.length}, ` +
            `segment: ${this.currentSegmentDeletes}, dir: ${this.deletionDirection})`
        );

        if (this.deletions.length < this.MIN_TOTAL_DELETIONS) {
            return null;
        }

        if (this.currentSegmentDeletes < this.MIN_SEGMENT_LENGTH) {
            return null;
        }

        // Check if user used word delete commands
        const firstItem = this.deletions.firstItem!;
        const lastItem = this.deletions.lastItem!;

        if (this.wasAnyCommandExecutedInRange(
            ['deleteWordLeft', 'deleteWordRight'],
            firstItem.timestamp,
            lastItem.timestamp
        )) {
            return null;
        }

        const totalChars = this.deletions.items.reduce((sum, item) => sum + item.rangeLength, 0);
        const suggestedCommand = this.deletionDirection === 'left' ? 'deleteWordLeft' : 'deleteWordRight';

        const keyHint = this.getFormattedKeybinding(suggestedCommand);

        this.logInfo(`matched: ${this.deletions.length} deletions (${totalChars} chars, ${this.deletionDirection})`);

        return {
            patternId: this.id,
            suggestedCommand,
            message: `You deleted a word character-by-character. Try ${keyHint} to delete words faster!`,
            detectedActions: []
        };
    }
}
