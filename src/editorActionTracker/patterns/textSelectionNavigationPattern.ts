import * as vscode from 'vscode';
import { EditorPatternId, getPatternSuggestedCommand } from '../patternRegistry';
import { EditorAction, EditorActionType, PatternMatch, SelectionStep } from '../types';
import { BaseEditorActionPattern } from './baseEditorActionPattern';
import { INSTANT_SELECTION_COMMANDS, WORD_SELECTION_COMMANDS } from './common/constants';
import { PatternUtils } from './common/patternUtils';
import { SequenceTracker } from './common/sequenceTracker';

export class TextSelectionNavigationPattern extends BaseEditorActionPattern {
    private selections: SequenceTracker<SelectionStep>;
    private lastSelection: vscode.Selection | null = null;
    private sequenceStartSelection: vscode.Selection | null = null;

    private readonly MAX_STEP_INTERVAL = 1000;
    private readonly MIN_STEPS_CHAR_FOR_WORD = 4;
    private readonly MIN_STEPS_CHAR_FOR_LINE = 6;
    private readonly MIN_STEPS_WORD_FOR_LINE = 2;
    private readonly MIN_CHARS_FOR_LINE_EDGE = 5;

    constructor() {
        super(
            EditorPatternId.TextSelectionNavigation,
            getPatternSuggestedCommand(EditorPatternId.TextSelectionNavigation)
        );
        this.selections = new SequenceTracker({ timeout: 3000, maxLength: 50 });
    }

    public reset(): void {
        this.logDebug(`resetting (had ${this.selections.length} steps)`);
        this.selections.reset();
        this.lastSelection = null;
        this.sequenceStartSelection = null;
    }

    public process(action: EditorAction): PatternMatch | null {
        if (action.type !== EditorActionType.Selection || !action.selection) {
            return null;
        }

        if (action.selection.isEmpty) {
            return this.checkAndReset();
        }

        // Check if instant commands were used
        if (this.wasAnyCommandRecentlyExecuted(INSTANT_SELECTION_COMMANDS)) {
            this.reset();
            return null;
        }

        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return null;
        }

        // Initialize
        if (!this.lastSelection) {
            this.lastSelection = action.selection;
            this.sequenceStartSelection = action.selection;
            return null;
        }

        // Check interval
        const timeSinceLastStep = action.timestamp - (this.selections.lastItem?.timestamp || action.timestamp);
        if (timeSinceLastStep > this.MAX_STEP_INTERVAL) {
            const result = this.checkForPattern();
            this.reset();
            this.lastSelection = action.selection;
            this.sequenceStartSelection = action.selection;
            return result;
        }

        // Analyze selection change
        const step = this.analyzeSelectionChange(editor, action.selection, action.timestamp);

        if (!step) {
            const result = this.checkForPattern();
            this.reset();
            this.lastSelection = action.selection;
            this.sequenceStartSelection = action.selection;
            return result;
        }

        // Track step
        this.selections.add(step);

        // Check for patterns
        const match = this.checkSmartPatterns(editor, action.selection);
        if (match) {
            return match;
        }

        this.lastSelection = action.selection;
        return null;
    }

    private analyzeSelectionChange(
        editor: vscode.TextEditor,
        newSelection: vscode.Selection,
        timestamp: number
    ): SelectionStep | null {
        if (!this.lastSelection) {
            return null;
        }

        const lastStart = this.lastSelection.start;
        const lastEnd = this.lastSelection.end;
        const newStart = newSelection.start;
        const newEnd = newSelection.end;

        // Must be on same line
        if (lastStart.line !== newStart.line || lastEnd.line !== newEnd.line) {
            return null;
        }

        const startDiff = newStart.character - lastStart.character;
        const endDiff = newEnd.character - lastEnd.character;

        let direction: 'left' | 'right' | 'unknown' = 'unknown';
        let stepSize = 0;
        let isWordStep = false;

        // Expanding right
        if (startDiff === 0 && endDiff > 0) {
            direction = 'right';
            stepSize = endDiff;
            isWordStep = endDiff > 1;
        }
        // Expanding left
        else if (endDiff === 0 && startDiff < 0) {
            direction = 'left';
            stepSize = Math.abs(startDiff);
            isWordStep = Math.abs(startDiff) > 1;
        }
        // Both ends moved
        else if (startDiff !== 0 && endDiff !== 0) {
            return null;
        }

        // Verify word steps
        if (isWordStep && !this.wasAnyCommandRecentlyExecuted(WORD_SELECTION_COMMANDS)) {
            isWordStep = false;
        }

        if (stepSize === 0 || direction === 'unknown') {
            return null;
        }

        const activePos = newSelection.active;
        const wasInWord = PatternUtils.isPositionInWord(editor, activePos);

        return {
            timestamp,
            line: activePos.line,
            character: activePos.character,
            startChar: newStart.character,
            endChar: newEnd.character,
            direction,
            stepSize,
            isWordStep,
            wasInWord
        };
    }

    private checkSmartPatterns(editor: vscode.TextEditor, currentSelection: vscode.Selection): PatternMatch | null {
        const wordSteps = this.selections.filter(s => s.isWordStep);
        const charSteps = this.selections.filter(s => !s.isWordStep);

        // Word-by-word → suggest line edge
        if (wordSteps.length >= this.MIN_STEPS_WORD_FOR_LINE) {
            const lineEdgeMatch = this.checkLineEdgePattern(editor, currentSelection, true);
            if (lineEdgeMatch) {
                return lineEdgeMatch;
            }
        }

        // Char-by-char
        if (charSteps.length >= this.MIN_STEPS_CHAR_FOR_WORD) {
            // Check if user already using word selection
            if (!this.wasAnyCommandRecentlyExecuted(WORD_SELECTION_COMMANDS, 1000)) {
                const wordMatch = this.checkWordSelectionPattern(editor, currentSelection, charSteps);
                if (wordMatch) {
                    return wordMatch;
                }
            }

            if (charSteps.length >= this.MIN_STEPS_CHAR_FOR_LINE) {
                const lineEdgeMatch = this.checkLineEdgePattern(editor, currentSelection, false);
                if (lineEdgeMatch) {
                    return lineEdgeMatch;
                }
            }
        }

        return null;
    }

    private checkWordSelectionPattern(
        editor: vscode.TextEditor,
        currentSelection: vscode.Selection,
        charSteps: SelectionStep[]
    ): PatternMatch | null {
        const activePos = currentSelection.active;
        const isCurrentlyInWord = PatternUtils.isPositionInWord(editor, activePos);
        const wasInWordSequence = charSteps.some(s => s.wasInWord);

        if (wasInWordSequence && !isCurrentlyInWord) {
            const direction = PatternUtils.getHorizontalPredominantDirection(charSteps);

            if (direction !== 'unknown') {
                this.logInfo(`word selection pattern detected (${charSteps.length} char steps)`);

                const suggestedCommand = direction === 'right'
                    ? 'cursorWordRightSelect'
                    : 'cursorWordLeftSelect';

                const keyHint = this.getFormattedKeybinding(suggestedCommand);
                const match: PatternMatch = {
                    patternId: this.id,
                    subPatternId: 'word-selection',
                    suggestedCommand,
                    message: `You selected text character-by-character. Try ${keyHint} to select by words!`,
                    detectedActions: []
                };

                this.reset();
                return match;
            }
        }

        return null;
    }

    private checkLineEdgePattern(
        editor: vscode.TextEditor,
        currentSelection: vscode.Selection,
        isWordByWord: boolean
    ): PatternMatch | null {
        if (!this.sequenceStartSelection) {
            return null;
        }

        const edgeInfo = PatternUtils.getLineEdgeInfo(editor, currentSelection.active);
        if (!edgeInfo || edgeInfo.lineText.trim().length < 3) {
            return null;
        }

        const activeChar = currentSelection.active.character;
        const anchorChar = currentSelection.anchor.character;

        const atLineStart = edgeInfo.atLineStart;
        const atLineEnd = edgeInfo.atLineEnd;

        if (!atLineStart && !atLineEnd) {
            return null;
        }

        // Check direction matches edge
        const selectingLeft = activeChar < anchorChar;
        const selectingRight = activeChar > anchorChar;

        if ((atLineStart && !selectingLeft) || (atLineEnd && !selectingRight)) {
            return null;
        }

        // Check selected chars
        const selectedChars = Math.abs(currentSelection.end.character - currentSelection.start.character);
        if (selectedChars < this.MIN_CHARS_FOR_LINE_EDGE) {
            return null;
        }

        // Check if started away from edge
        const startActiveChar = this.sequenceStartSelection.active.character;
        const startedAwayFromEdge = atLineStart
            ? startActiveChar > this.MIN_CHARS_FOR_LINE_EDGE
            : startActiveChar < (edgeInfo.lineLength - this.MIN_CHARS_FOR_LINE_EDGE);

        if (!startedAwayFromEdge) {
            return null;
        }

        const direction = atLineStart ? 'start' : 'end';
        const suggestedCommand = direction === 'end' ? 'cursorEndSelect' : 'cursorHomeSelect';
        const keyHint = this.getFormattedKeybinding(suggestedCommand);

        const selectionMethod = isWordByWord ? 'word-by-word' : 'character-by-character';
        this.logInfo(`line edge selection detected (${this.selections.length} steps ${selectionMethod} to ${direction})`);

        const message = `You selected to line ${direction} ${selectionMethod}. Try ${keyHint} to select instantly!`;

        const match: PatternMatch = {
            patternId: this.id,
            subPatternId: 'line-edge-selection',
            suggestedCommand,
            message,
            detectedActions: []
        };

        this.reset();
        return match;
    }

    private checkAndReset(): PatternMatch | null {
        const result = this.selections.length >= this.MIN_STEPS_CHAR_FOR_WORD
            ? this.checkForPattern()
            : null;
        this.reset();
        return result;
    }

    private checkForPattern(): PatternMatch | null {
        if (this.selections.length < this.MIN_STEPS_CHAR_FOR_WORD) {
            return null;
        }

        const hasWordSteps = this.selections.some(s => s.isWordStep);
        const direction = PatternUtils.getHorizontalPredominantDirection([...this.selections.items]);

        if (direction === 'unknown') {
            return null;
        }

        // Word-by-word fallback
        if (hasWordSteps) {
            const wordStepCount = this.selections.filter(s => s.isWordStep).length;
            if (wordStepCount >= this.MIN_STEPS_WORD_FOR_LINE) {
                this.logInfo(`word-by-word pattern matched (${wordStepCount} word steps)`);

                const suggestedCommand = direction === 'right' ? 'cursorEndSelect' : 'cursorHomeSelect';
                const keyHint = this.getFormattedKeybinding(suggestedCommand);
                return {
                    patternId: this.id,
                    subPatternId: 'word-to-line',
                    suggestedCommand,
                    message: `You selected multiple words. Try ${keyHint} to select to line edge faster!`,
                    detectedActions: []
                };
            }
        }

        // Char-by-char fallback
        this.logInfo(`general char-by-char pattern matched (${this.selections.length} steps)`);

        const suggestedCommand = direction === 'right'
            ? 'cursorWordRightSelect'
            : 'cursorWordLeftSelect';

        const keyHint = this.getFormattedKeybinding(suggestedCommand);

        return {
            patternId: this.id,
            subPatternId: 'general-selection',
            suggestedCommand,
            message: `You selected text slowly with Shift+Arrow. Try ${keyHint} to select faster by words!`,
            detectedActions: []
        };
    }
}
