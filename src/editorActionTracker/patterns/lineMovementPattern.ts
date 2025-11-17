import * as vscode from 'vscode';
import { EditorPatternId, getPatternSuggestedCommand } from '../patternRegistry';
import { EditorAction, EditorActionType, PatternMatch } from '../types';
import { BaseEditorActionPattern } from './baseEditorActionPattern';
import { FAST_ACTION_THRESHOLD_MS } from './common/constants';

export class LineMovementPattern extends BaseEditorActionPattern {
    private state: 'idle' | 'deleted' = 'idle';
    private deletedLine: number | null = null;
    private deletedContent: string | null = null;
    private deleteTimestamp = 0;
    private lastActionTime = 0;

    private readonly TIMEOUT_MS = 3000;
    private readonly MIN_LINE_LENGTH = 3;

    constructor() {
        super(
            EditorPatternId.LineMovementManual,
            getPatternSuggestedCommand(EditorPatternId.LineMovementManual)
        );
    }

    public reset(): void {
        this.state = 'idle';
        this.deletedLine = null;
        this.deletedContent = null;
        this.deleteTimestamp = 0;
        this.lastActionTime = 0;
    }

    public process(action: EditorAction): PatternMatch | null {
        // Check timeout
        if (this.lastActionTime > 0 && (action.timestamp - this.lastActionTime) > this.TIMEOUT_MS) {
            this.reset();
            return null;
        }

        this.lastActionTime = action.timestamp;

        switch (this.state) {
            case 'idle':
                return this.handleIdleState(action);
            case 'deleted':
                return this.handleDeletedState(action);
        }
    }

    private handleIdleState(action: EditorAction): PatternMatch | null {
        if (action.type === EditorActionType.Delete && action.range && action.rangeLength) {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                return null;
            }

            const range = action.range;

            // Multi-line deletion or newline deletion
            if (range.end.line > range.start.line ||
                (range.end.line === range.start.line && range.end.character === 0 && range.start.character !== 0)) {

                try {
                    const deletedText = action.document?.getText?.(range) || '';
                    const trimmedContent = deletedText.replace(/^\s+|\s+$/g, '');

                    // Игнорируем, если удалили только пустую строку или перенос
                    if (trimmedContent.length < this.MIN_LINE_LENGTH) {
                        this.logDebug('deleted content too short - not tracking');
                        return null;
                    }

                    this.deletedLine = range.start.line;
                    this.deletedContent = trimmedContent;
                    this.deleteTimestamp = action.timestamp;
                    this.state = 'deleted';
                    this.logDebug(`detected line deletion: "${trimmedContent.substring(0, 30)}..."`);
                } catch (error) {
                    this.logDebug('could not get deleted content');
                    return null;
                }
            }
        }

        return null;
    }

    private handleDeletedState(action: EditorAction): PatternMatch | null {
        if (action.type === EditorActionType.Insert && action.range && action.text) {
            const insertLine = action.range.start.line;

            if (this.deletedLine !== null && this.deletedContent !== null) {
                const timeDiff = action.timestamp - this.deleteTimestamp;

                // Too fast = likely shortcut
                if (timeDiff < FAST_ACTION_THRESHOLD_MS) {
                    this.logDebug(`too fast (${timeDiff}ms), likely shortcut`);
                    this.reset();
                    return null;
                }

                // Check if move command was used
                if (this.wasAnyCommandExecutedInRange(
                    ['editor.action.moveLinesUpAction', 'editor.action.moveLinesDownAction'],
                    this.deleteTimestamp,
                    action.timestamp
                )) {
                    this.reset();
                    return null;
                }

                // Same line - not a move
                if (insertLine === this.deletedLine) {
                    this.logDebug('insert on same line - not a line move');
                    this.reset();
                    return null;
                }

                const insertedContent = action.text.replace(/^\s+|\s+$/g, '');
                if (!insertedContent.includes(this.deletedContent) &&
                    !this.deletedContent.includes(insertedContent)) {
                    this.logDebug('inserted content does not match deleted - not a line move');
                    this.reset();
                    return null;
                }

                const distance = Math.abs(insertLine - this.deletedLine);

                if (distance <= 2 && action.text.includes('\n') && timeDiff < 2000) {
                    const command = insertLine < this.deletedLine
                        ? 'editor.action.moveLinesUpAction'
                        : 'editor.action.moveLinesDownAction';

                    const keyHint = this.getFormattedKeybinding(this.suggestedCommand);

                    this.logInfo(`matched (${timeDiff}ms between actions)`);

                    const match: PatternMatch = {
                        patternId: this.id,
                        suggestedCommand: command,
                        message: `You manually moved a line. Try ${keyHint} to move lines faster!`,
                        detectedActions: []
                    };

                    this.reset();
                    return match;
                }
            }
        }

        if (action.type !== EditorActionType.Insert) {
            this.reset();
        }

        return null;
    }
}

